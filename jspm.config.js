SystemJS.config({
  paths: {
    "npm:": "jspm_packages/npm/",
    "github:": "jspm_packages/github/"
  },
  browserConfig: {
    "baseURL": "/",
    "paths": {
      "jw-ng-forward/": "src/"
    }
  },
  nodeConfig: {
    "paths": {
      "jw-ng-forward/": "lib/"
    }
  },
  devConfig: {
    "map": {
      "plugin-babel": "npm:systemjs-plugin-babel@0.0.12"
    }
  },
  transpiler: "plugin-babel",
  packages: {
    "jw-ng-forward": {
      "main": "jw-ng-forward.js",
      "meta": {
        "*.js": {
          "loader": "plugin-babel"
        }
      }
    }
  }
});

SystemJS.config({
  packageConfigPaths: [
    "npm:@*/*.json",
    "npm:*.json",
    "github:*/*.json"
  ],
  map: {
    "angular": "github:angular/bower-angular@1.5.8",
    "reflect-metadata": "npm:reflect-metadata@0.1.3",
    "rxjs": "npm:rxjs-es@5.0.0-beta.10"
  },
  packages: {
    "npm:rxjs-es@5.0.0-beta.10": {
      "map": {
        "symbol-observable": "npm:symbol-observable@1.0.1"
      }
    }
  }
});
