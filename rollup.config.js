// ... tes autres imports
import typescript from "rollup-plugin-typescript2";

const plugins = [
    typescript({
        clean: true,
        check: false,
        tsconfigOverride: {
            compilerOptions: {
                noEmit: false,
                emitDecoratorMetadata: true,
                experimentalDecorators: true
            }
        }
    }),
    nodeResolve({
        browser: true,
        preferBuiltins: false
    }),
    commonjs(),
    json(),
    babel({
        exclude: "node_modules/**",
        babelHelpers: "bundled",
        // On s'assure que Babel comprend aussi les décorateurs
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    dev && serve(serveopts),
    !dev && terser(),
];