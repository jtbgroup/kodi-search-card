import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { babel } from "@rollup/plugin-babel";

export default {
    input: "src/kodi-search-card.ts", // Single entry point
    output: {
        dir: "dist",
        format: "es",
        entryFileNames: "kodi-search-card.js",
    },
    plugins: [
        resolve(),
        commonjs(),
        typescript({ tsconfig: "./tsconfig.json" }),
        babel({
            babelHelpers: "bundled",
            exclude: "node_modules/**",
            presets: ["@babel/preset-env"]
        }),
    ],
};