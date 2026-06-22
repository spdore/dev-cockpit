import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useUIStore } from "@/stores/ui-store";

// ============================================================
// Mock Next.js navigation
// ============================================================
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  })),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Suppress framer-motion warnings in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => <div {...props}>{children as React.ReactNode}</div>,
    button: ({ children, ...props }: Record<string, unknown>) => <button {...props}>{children as React.ReactNode}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ============================================================
// Wrapper with required providers
// ============================================================
function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delay={0}>
      <ThemeProvider>{children}</ThemeProvider>
    </TooltipProvider>
  );
}

// ============================================================
// T14 — Sidebar Component
// ============================================================
describe("Sidebar", () => {
  beforeEach(() => {
    useUIStore.setState({
      theme: "system",
      sidebarCollapsed: false,
      commandPaletteOpen: false,
    });
  });

  it("T14.1 — should render all 5 navigation items", () => {
    render(
      <Wrapper>
        <Sidebar />
      </Wrapper>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("项目")).toBeInTheDocument();
    expect(screen.getByText("任务")).toBeInTheDocument();
    expect(screen.getByText("日历")).toBeInTheDocument();
    expect(screen.getByText("设置")).toBeInTheDocument();
  });

  it("should render DevCockpit branding when expanded", () => {
    render(
      <Wrapper>
        <Sidebar />
      </Wrapper>
    );
    expect(screen.getByText("DevCockpit")).toBeInTheDocument();
  });

  it("T14.2 — should highlight the active nav item based on pathname", () => {
    render(
      <Wrapper>
        <Sidebar />
      </Wrapper>
    );
    // The Dashboard link is active (pathname = /dashboard)
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink?.className).toContain("sidebar-primary");
  });

  it("T14.3 — should collapse to 60px when toggle is clicked", async () => {
    render(
      <Wrapper>
        <Sidebar />
      </Wrapper>
    );

    // Initially expanded
    expect(screen.getByText("DevCockpit")).toBeInTheDocument();

    // Find the collapse toggle button (the last button in the sidebar — bottom toggle)
    const buttons = screen.getAllByRole("button");
    // The toggle is the last button (inside the bottom border-t section)
    const toggleBtn = buttons[buttons.length - 1];
    expect(toggleBtn).toBeTruthy();
    await userEvent.click(toggleBtn!);

    // Now collapsed
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });

  it("should show only 'D' when collapsed", async () => {
    useUIStore.setState({ sidebarCollapsed: true });
    render(
      <Wrapper>
        <Sidebar />
      </Wrapper>
    );
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.queryByText("DevCockpit")).not.toBeInTheDocument();
  });

  it("should hide nav labels when collapsed", async () => {
    useUIStore.setState({ sidebarCollapsed: true });
    render(
      <Wrapper>
        <Sidebar />
      </Wrapper>
    );
    // Icons should still be present, but no text labels
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });
});

// ============================================================
// T15 — Topbar Component
// ============================================================
describe("Topbar", () => {
  beforeEach(() => {
    useUIStore.setState({
      theme: "system",
      sidebarCollapsed: false,
      commandPaletteOpen: false,
    });
  });

  it("T15.1 — should render greeting text", () => {
    render(
      <Wrapper>
        <Topbar />
      </Wrapper>
    );
    // Should display a greeting with emoji (time-dependent)
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toBeInTheDocument();
    // Should contain an emoji character
    expect(heading.textContent).toMatch(/[☀️⛅🌙]/);
  });

  it("should display current date in zh-CN format", () => {
    render(
      <Wrapper>
        <Topbar />
      </Wrapper>
    );
    // Date should contain Chinese characters for month/day/weekday
    const dateText = screen.getByText(/年|月|日/);
    expect(dateText).toBeInTheDocument();
  });

  it("T15.2 — should have a button that opens command palette", async () => {
    render(
      <Wrapper>
        <Topbar />
      </Wrapper>
    );

    const searchBtn = screen.getByText("搜索命令...").closest("button");
    expect(searchBtn).toBeTruthy();
    if (searchBtn) await userEvent.click(searchBtn);
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
  });

  it("T15.3 — should render theme toggle icon button", async () => {
    render(
      <Wrapper>
        <Topbar />
      </Wrapper>
    );

    // Theme toggle is a ghost button. Find all buttons and verify at least one exists.
    const buttons = screen.getAllByRole("button");
    // At least 2 buttons: search trigger + theme toggle
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it("T15.4 — should display avatar with 'XC' initials", () => {
    render(
      <Wrapper>
        <Topbar />
      </Wrapper>
    );
    expect(screen.getByText("XC")).toBeInTheDocument();
  });

  it("should display keyboard shortcut kbd for search on sm+ screens", () => {
    render(
      <Wrapper>
        <Topbar />
      </Wrapper>
    );
    // The ⌘K keyboard shortcut is rendered
    const kbdElements = document.querySelectorAll("kbd");
    expect(kbdElements.length).toBeGreaterThan(0);
  });
});

// ============================================================
// T16 — ThemeProvider Component
// ============================================================
describe("ThemeProvider", () => {
  beforeEach(() => {
    useUIStore.setState({ theme: "system" });
    document.documentElement.classList.remove("light", "dark");
  });

  it("T16.1 — should add light class when theme is light", () => {
    useUIStore.setState({ theme: "light" });
    render(
      <ThemeProvider>
        <div>test</div>
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("T16.2 — should add dark class when theme is dark", () => {
    useUIStore.setState({ theme: "dark" });
    render(
      <ThemeProvider>
        <div>test</div>
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });

  it("T16.3 — should follow system preference when theme is system", () => {
    // Mock matchMedia to return dark mode
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    useUIStore.setState({ theme: "system" });
    render(
      <ThemeProvider>
        <div>test</div>
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("should clean up classes on theme change", () => {
    useUIStore.setState({ theme: "light" });
    const { rerender } = render(
      <ThemeProvider>
        <div>test</div>
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("light")).toBe(true);

    useUIStore.setState({ theme: "dark" });
    rerender(
      <ThemeProvider>
        <div>test</div>
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });
});
