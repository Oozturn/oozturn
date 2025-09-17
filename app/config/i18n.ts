import en from "~/locales/en";
import fr from "~/locales/fr";
import xx from "~/locales/xx";

// This is the list of languages your application supports,
// the fallback is always the last
export const supportedLngs = ["xx", "en", "fr"];

// This is the language you want to use in case
// if the user preferred language is not in the supportedLngs
export const fallbackLng = "fr";

// The default namespace of i18next is "translation", but you can customize it
// here
export const defaultNS = "translation";

// These are the translation files we created, `translation` is the namespace
// we want to use, we'll use this to include the translations in the bundle
// instead of loading them on-demand
export const resources = {
  fr: { translation: fr },
  en: { translation: en },
  xx: { translation: xx }
};
