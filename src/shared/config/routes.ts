export const ROUTES = {
  home: "/",
  people: "/people",
  employee: (id: string) => `/people/${id}`,
} as const;
