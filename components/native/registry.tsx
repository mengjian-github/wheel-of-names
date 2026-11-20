import type { ComponentType } from "react";

import type { Route, SiteConfig } from "../../lib/site-config";

import type { PageContent } from "../../lib/content";

import NativeToolHome from "./NativeToolHome";
import FrozenCopyPage from "./FrozenCopyPage";

// AUTO-COMPOSED by the per-route native authoring pass — entries are
// merged per route from each accepted patch; hand edits are overwritten.
// An unregistered route renders the deterministic composition.

export type NativeRouteProps = {
  route: Route;
  content: PageContent;
  config: SiteConfig;
};

export const nativeRoutes: Record<string, ComponentType<NativeRouteProps>> = {
  "/": NativeToolHome,
  "/about/": FrozenCopyPage,
  "/classroom-name-picker/": NativeToolHome,
  "/contact/": FrozenCopyPage,
  "/cookies/": FrozenCopyPage,
  "/fairness/": NativeToolHome,
  "/picker-wheel/": NativeToolHome,
  "/pricing/": FrozenCopyPage,
  "/privacy/": FrozenCopyPage,
  "/raffle-wheel/": NativeToolHome,
  "/random-name-picker/": NativeToolHome,
  "/refunds/": FrozenCopyPage,
  "/terms/": FrozenCopyPage,
  "/vs/pickerwheel/": FrozenCopyPage,
  "/wheel-spinner/": NativeToolHome,
};

