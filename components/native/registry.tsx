import type { ComponentType } from "react";

import type { Route, SiteConfig } from "../../lib/site-config";

import type { PageContent } from "../../lib/content";

import HomePage from "./HomePage";
import AboutPage from "./AboutPage";
import ClassroomNamePickerPage from "./ClassroomNamePickerPage";
import ContactPage from "./ContactPage";
import CookiesPage from "./CookiesPage";
import FairnessPage from "./FairnessPage";
import PickerWheelPage from "./PickerWheelPage";
import PricingPage from "./PricingPage";
import PrivacyPage from "./PrivacyPage";
import RaffleWheelPage from "./RaffleWheelPage";
import RandomNamePickerPage from "./RandomNamePickerPage";
import RefundsPage from "./RefundsPage";
import TermsPage from "./TermsPage";
import VsPickerwheelPage from "./VsPickerwheelPage";
import WheelSpinnerPage from "./WheelSpinnerPage";

// AUTO-COMPOSED by the per-route native authoring pass — entries are
// merged per route from each accepted patch; hand edits are overwritten.
// An unregistered route renders the deterministic composition.

export type NativeRouteProps = {
  route: Route;
  content: PageContent;
  config: SiteConfig;
};

export const nativeRoutes: Record<string, ComponentType<NativeRouteProps>> = {
  "/": HomePage,
  "/about/": AboutPage,
  "/classroom-name-picker/": ClassroomNamePickerPage,
  "/contact/": ContactPage,
  "/cookies/": CookiesPage,
  "/fairness/": FairnessPage,
  "/picker-wheel/": PickerWheelPage,
  "/pricing/": PricingPage,
  "/privacy/": PrivacyPage,
  "/raffle-wheel/": RaffleWheelPage,
  "/random-name-picker/": RandomNamePickerPage,
  "/refunds/": RefundsPage,
  "/terms/": TermsPage,
  "/vs/pickerwheel/": VsPickerwheelPage,
  "/wheel-spinner/": WheelSpinnerPage,
};

