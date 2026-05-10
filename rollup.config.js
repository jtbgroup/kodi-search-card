import typescript from "rollup-plugin-typescript2";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import terser from '@rollup/plugin-terser';
import serve from "rollup-plugin-serve";
import json from "@rollup/plugin-json";

const dev = process.env.ROLLUP_WATCH;

const serveopts = {
    contentBase: ["./dist"],
    host: "0.0.0.0",
    port: 5000,
    allowCrossOrigin: true,
    headers: {
        "Access-Control-Allow-Origin": "*",
    },
};

const plugins = [
    nodeResolve({
        browser: true,
        preferBuiltins: false
    }),
    commonjs(),
    typescript({
        clean: true,
        check: false // Permet de passer les erreurs de type strictes lors du bundle
    }),
    json(),
    babel({
        exclude: "node_modules/**",
        babelHelpers: "bundled",
    }),
    dev && serve(serveopts),
    !dev && terser(),
];

export default [
    {
        input: "src/kodi-search-card.ts",
        output: {
            dir: "dist",
            format: "es",
            sourcemap: dev,
        },
        plugins: [...plugins],
        // On ignore les warnings de "this" circulaire fréquents avec Lit
        context: "window",
    },
];