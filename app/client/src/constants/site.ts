export const SITE_TITLE = "Pets Workshop Demo";

export const buildTitle = (page?: string): string =>
  page ? `${page} - ${SITE_TITLE}` : SITE_TITLE;
