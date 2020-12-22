exports.onCreateWebpackConfig = ({ stage, loaders, actions }) => {
    if (stage === "build-html") {
      actions.setWebpackConfig({
        module: {
          rules: [
            {
              test: /swarm-js/,
              use: loaders.null(),
            },
          ],
        },
      })
    }
  }