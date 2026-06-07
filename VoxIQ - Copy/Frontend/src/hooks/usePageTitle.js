import { useEffect } from "react";

/**
 * usePageTitle
 * Sets the browser tab title when the component mounts.
 *
 * Usage:
 *   usePageTitle("Sign In — VoxIQ");
 */
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}