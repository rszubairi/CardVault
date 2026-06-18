const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      // Required by React Native Firebase when building with static frameworks.
      // Must appear before the `use_frameworks!` line that expo-build-properties adds.
      if (!contents.includes('$RNFirebaseAsStaticFramework')) {
        contents = `$RNFirebaseAsStaticFramework = true\n` + contents;
      }

      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
};
