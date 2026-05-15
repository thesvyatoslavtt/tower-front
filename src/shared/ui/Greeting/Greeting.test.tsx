import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Greeting } from "./Greeting";

describe("Greeting", () => {
  it("renders a greeting for the given name", () => {
    render(<Greeting name="Ada" />);

    expect(screen.getByText("Hello, Ada!")).toBeInTheDocument();
  });
});
