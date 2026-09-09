import format from "ultracite/oxfmt";
import core from "ultracite/oxlint/core";
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: { ...format },
  lint: {
    ...core,
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
