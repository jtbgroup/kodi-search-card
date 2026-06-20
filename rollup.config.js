import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import { babel } from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";

export default {
    input: "src/kodi-search-card.ts",
    output: {
        dir: "dist",
        format: "es",
        entryFileNames: "kodi-search-card.js",
        inlineDynamicImports: true,
    },
    plugins: [
        json(),
        resolve({
            browser: true,
            exportConditions: ["browser", "module", "default"],
            extensions: [".ts", ".js"],
            preferBuiltins: false,
        }),
        commonjs(),
        typescript({
            tsconfig: "./tsconfig.json",
            declaration: false,
        }),
        babel({
            babelHelpers: "bundled",
            exclude: "node_modules/**",
            presets: ["@babel/preset-env"],
        }),
        terser(),
    ],
};