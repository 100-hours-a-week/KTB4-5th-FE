import type { Preview } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { jetBrainsMono } from "@/_app/styles/fonts";
import "@/_app/styles/globals.css";

document.documentElement.classList.add(jetBrainsMono.variable);

const consoleErrors: string[] = [];

function isKnownStorybookLinkWarning(message: string) {
  return (
    message.includes("Unknown event handler property") &&
    message.includes("onNavigate")
  );
}

function describeElement(element: Element) {
  const text = element.textContent?.trim().slice(0, 30) ?? "";
  return `<${element.tagName.toLowerCase()} class="${element.getAttribute("class") ?? ""}"> ${text}`;
}

function findHorizontalOverflow(frame: Element) {
  const limit = frame.getBoundingClientRect().right + 1;
  const overflowing: string[] = [];

  function walk(element: Element, clipped: boolean) {
    const rect = element.getBoundingClientRect();
    const clipsChildren = getComputedStyle(element).overflowX !== "visible";
    const contentWidth = clipsChildren
      ? rect.width
      : Math.max(rect.width, element.scrollWidth);

    if (!clipped && rect.width > 0 && rect.left + contentWidth > limit) {
      overflowing.push(describeElement(element));
    }

    for (const child of element.children) {
      walk(child, clipped || clipsChildren);
    }
  }

  for (const child of frame.children) {
    walk(child, false);
  }

  return overflowing;
}

const preview: Preview = {
  beforeEach() {
    consoleErrors.length = 0;
    const originalError = console.error;

    console.error = (...args: unknown[]) => {
      const message = args.map(String).join(" ");
      if (!isKnownStorybookLinkWarning(message)) consoleErrors.push(message);
      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  },
  async afterEach({ canvasElement }) {
    await expect(consoleErrors, "console.error 발생").toEqual([]);

    const frame = canvasElement.firstElementChild;
    if (frame) {
      await expect(
        findHorizontalOverflow(frame),
        "앱 프레임 가로 넘침",
      ).toEqual([]);
    }
  },
  decorators: [
    (Story) => (
      <div
        className="isolate mx-auto flex min-h-[100dvh] w-[min(100%,var(--app-max-width))] overflow-x-clip bg-app-bg [background-image:repeating-linear-gradient(180deg,transparent_0_25px,rgb(26_26_30_/_3%)_25px_26px)]"
        style={{ padding: 16 }}
      >
        <div className="min-w-0 flex-1">
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },

    viewport: {
      options: {
        mobileBase: {
          name: "모바일 기준 360",
          styles: { width: "360px", height: "740px" },
          type: "mobile",
        },
        mobileMax: {
          name: "모바일 최대 430",
          styles: { width: "430px", height: "932px" },
          type: "mobile",
        },
      },
    },
  },
  initialGlobals: {
    viewport: { value: "mobileBase", isRotated: false },
  },
};

export default preview;
