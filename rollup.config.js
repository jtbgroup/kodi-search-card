import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import serve from "rollup-plugin-serve";
import terser from "@rollup/plugin-terser";

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
    nodeResolve(),
    commonjs(),
    typescript(),
    json(),
    dev && serve(serveopts),
    !dev && terser(),
];

export default [
    {
        input: "src/kodi-search-card.ts",
        output: {
            dir: "dist",
            format: "es",
        },
        plugins: [...plugins],
    },
];
