module.exports = {
  plugins: [
    {
      resolve: `gatsby-plugin-material-ui`,
      options: {
        stylesProvider: {
          injectFirst: true,
        },
      },
    },
    {
      resolve: `gatsby-plugin-express`,
      options: {
        output: 'config/gatsby-express.json',
      }
    },
    `gatsby-plugin-remove-trailing-slashes`
  ],
}