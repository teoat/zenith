import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { Breadcrumbs } from "../Breadcrumbs";
import "@testing-library/jest-dom";

// Mock useLocation to control the path in tests
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: jest.fn(),
}));

describe("Breadcrumbs", () => {
  beforeEach(() => {
    (useLocation as jest.Mock).mockReturnValue({ pathname: "/" });
  });

  it("does not render on home page", () => {
    render(
      <MemoryRouter>
        <Breadcrumbs />
      </MemoryRouter>
    );
    const nav = screen.queryByRole("navigation", { name: "Breadcrumb" });
    expect(nav).not.toBeInTheDocument();
  });

  it("renders breadcrumbs for nested routes", () => {
    (useLocation as jest.Mock).mockReturnValue({ pathname: "/cases" });

    render(
      <MemoryRouter>
        <Breadcrumbs />
      </MemoryRouter>
    );

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav).toBeInTheDocument();

    // Should have Home and Cases
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Cases")).toBeInTheDocument();
  });

  it("last item should have aria-current='page'", () => {
    (useLocation as jest.Mock).mockReturnValue({ pathname: "/cases" });

    render(
      <MemoryRouter>
        <Breadcrumbs />
      </MemoryRouter>
    );

    // Get the last item "Cases"
    const currentItem = screen.getByText("Cases");
    // The text is inside a span, we need to check if that span or its parent has aria-current
    // In the implementation: <span ...>{crumb.label}</span>

    // We expect the text container (the span) to have aria-current="page"
    // But currently it is NOT implemented, so this test should fail if we assert it.

    // Let's verify what it currently is.
    // Based on code: <span className="font-medium ...">Cases</span>

    // We want: <span aria-current="page" ...>Cases</span>
    expect(currentItem).toHaveAttribute("aria-current", "page");
  });
});
