import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import serve from "rollup-plugin-serve";
import terser from "@rollup/plugin-terser";

const port = process.env.PORT || 5001;

export default {
    input: "src/kodi-search-card.ts",
    output: {
        dir: "./dist",
        format: "es",
        inlineDynamicImports: true,
    },
    // Rien n'est external : tout est bundlé dans le fichier unique
    external: [],
    plugins: [
        nodeResolve({
            browser: true,
            exportConditions: ["browser", "module", "default"],
            extensions: [".ts", ".js"],
        }),
        commonjs(),
        typescript({ tsconfig: "./tsconfig.json" }),
        json(),
        terser(),
        serve({
            contentBase: "./dist",
            host: "0.0.0.0",
            port: port,
            allowCrossOrigin: true,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        }),
    ],
};
