export const exportButtonMock = {
  onExport: (format: "CSV" | "PDF") => {
    // Storybook-only callback stub.
    void format;
  },
};
