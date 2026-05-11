import typescript from "rollup-plugin-typescript2";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";
import serve from "rollup-plugin-serve";
import json from "@rollup/plugin-json";

const dev = process.env.ROLLUP_WATCH;

const plugins = [
    // 1. On résout les chemins en premier
    nodeResolve({
        browser: true,
        extensions: [".ts", ".js", ".json"],
        preferBuiltins: false,
    }),
    // 2. On transforme le TypeScript
    typescript({
        clean: true,
        check: false, // On désactive le check strict pour laisser le bundle se faire
        tsconfigOverride: {
            compilerOptions: {
                noEmit: false,
                declaration: false,
                emitDecoratorMetadata: true,
                experimentalDecorators: true,
            },
        },
    }),
    commonjs(),
    json(),
    // 3. Babel pour la compatibilité finale
    babel({
        exclude: "node_modules/**",
        babelHelpers: "bundled",
        extensions: [".ts", ".js"],
        presets: [["@babel/preset-env", { targets: { browsers: "last 2 versions" } }], "@babel/preset-typescript"],
        plugins: [
            ["@babel/plugin-proposal-decorators", { legacy: true }],
            ["@babel/plugin-proposal-class-properties", { loose: true }],
        ],
    }),
    dev &&
        serve({
            contentBase: ["./dist"],
            host: "0.0.0.0",
            port: 5000,
            allowCrossOrigin: true,
            headers: { "Access-Control-Allow-Origin": "*" },
        }),
    !dev && terser(),
];

export default {
    input: "src/kodi-search-card.ts",
    output: {
        dir: "dist",
        format: "iife",
        sourcemap: dev,
    },
    plugins: plugins,
    context: "window",
};

