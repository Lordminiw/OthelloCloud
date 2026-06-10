const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function createNavigationBaseTheme(dark) {
  return {
    dark,
    colors: {
      primary: dark ? "#ffffff" : "#000000",
      background: dark ? "#111111" : "#ffffff",
      card: dark ? "#222222" : "#fefefe",
      text: dark ? "#f5f5f5" : "#111111",
      border: dark ? "#333333" : "#dddddd",
      notification: dark ? "#ff9999" : "#cc3333",
    },
    fonts: {
      regular: { fontFamily: "System", fontWeight: "400" },
      medium: { fontFamily: "System", fontWeight: "500" },
      bold: { fontFamily: "System", fontWeight: "700" },
      heavy: { fontFamily: "System", fontWeight: "800" },
    },
  };
}

function createPaperBaseTheme(dark) {
  return {
    dark,
    version: 3,
    isV3: true,
    roundness: 4,
    animation: { scale: 1 },
    fonts: {},
    colors: {
      primary: dark ? "#ffffff" : "#000000",
      primaryContainer: dark ? "#333333" : "#eeeeee",
      secondary: dark ? "#dddddd" : "#111111",
      secondaryContainer: dark ? "#444444" : "#dddddd",
      tertiary: dark ? "#cccccc" : "#222222",
      tertiaryContainer: dark ? "#555555" : "#cccccc",
      surface: dark ? "#111111" : "#ffffff",
      surfaceVariant: dark ? "#222222" : "#f7f7f7",
      surfaceDisabled: dark ? "#333333" : "#e7e7e7",
      background: dark ? "#000000" : "#fafafa",
      error: "#ba1a1a",
      errorContainer: dark ? "#93000a" : "#ffdad6",
      onPrimary: dark ? "#000000" : "#ffffff",
      onPrimaryContainer: dark ? "#ffffff" : "#000000",
      onSecondary: dark ? "#000000" : "#ffffff",
      onSecondaryContainer: dark ? "#ffffff" : "#000000",
      onTertiary: dark ? "#000000" : "#ffffff",
      onTertiaryContainer: dark ? "#ffffff" : "#000000",
      onSurface: dark ? "#f5f5f5" : "#111111",
      onSurfaceVariant: dark ? "#dddddd" : "#444444",
      onSurfaceDisabled: dark ? "#777777" : "#999999",
      onError: "#ffffff",
      onErrorContainer: dark ? "#ffdad6" : "#410002",
      onBackground: dark ? "#f5f5f5" : "#111111",
      outline: dark ? "#888888" : "#777777",
      outlineVariant: dark ? "#666666" : "#bbbbbb",
      inverseSurface: dark ? "#f5f5f5" : "#222222",
      inverseOnSurface: dark ? "#111111" : "#f5f5f5",
      inversePrimary: dark ? "#aaaaaa" : "#555555",
      shadow: "#000000",
      scrim: "#000000",
      backdrop: "rgba(0,0,0,0.4)",
      elevation: {
        level0: dark ? "#000000" : "#ffffff",
        level1: dark ? "#111111" : "#f5f5f5",
        level2: dark ? "#222222" : "#eeeeee",
        level3: dark ? "#333333" : "#e7e7e7",
        level4: dark ? "#444444" : "#e0e0e0",
        level5: dark ? "#555555" : "#d9d9d9",
      },
    },
  };
}

async function main() {
  const themeDir = path.join(process.cwd(), "src", "theme");
  const sourcePath = path.join(themeDir, "brand.ts");
  const source = fs.readFileSync(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: sourcePath,
  });
  const compiledPath = path.join(themeDir, ".brand.test.tmp.cjs");

  fs.writeFileSync(compiledPath, transpiled.outputText);

  try {
    const compiledSource = fs.readFileSync(compiledPath, "utf8");
    const module = { exports: {} };
    const script = new vm.Script(
      `(function (require, module, exports) { ${compiledSource}\n})`,
      { filename: compiledPath }
    );
    const customRequire = (specifier) => {
      if (specifier === "@react-navigation/native") {
        return {
          DarkTheme: createNavigationBaseTheme(true),
          DefaultTheme: createNavigationBaseTheme(false),
        };
      }

      if (specifier === "react-native-paper") {
        return {
          MD3DarkTheme: createPaperBaseTheme(true),
          MD3LightTheme: createPaperBaseTheme(false),
        };
      }

      return require(specifier);
    };

    script.runInThisContext()(customRequire, module, module.exports);

    const { brand, createNavigationTheme, createPaperTheme } = module.exports;

    assert.equal(brand.colors.primary, "#B85C38");
    assert.equal(brand.colors.background, "#FFF7F1");
    assert.equal(brand.radius.hero, 28);
    assert.equal(brand.spacing.pageX, 18);

    const paperTheme = createPaperTheme("light");
    assert.equal(paperTheme.colors.primary, "#B85C38");
    assert.equal(paperTheme.colors.background, "#FFF7F1");
    assert.equal(paperTheme.colors.surface, "#FFFDFC");
    assert.equal(paperTheme.roundness, 16);

    const navigationTheme = createNavigationTheme("light");
    assert.equal(navigationTheme.colors.primary, "#B85C38");
    assert.equal(navigationTheme.colors.background, "#FFF7F1");
    assert.equal(navigationTheme.colors.card, "#FFFDFC");
    assert.equal(navigationTheme.colors.text, "#4F342B");
  } finally {
    fs.rmSync(compiledPath, { force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
