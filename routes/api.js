const express = require('express')
const pckg = require('../package.json')
const branchName = require('current-git-branch')()
const router = express.Router()

router.get('/', (req, res) => {
  res.json({
    api: pckg.prettyName,
    version: pckg.version,
    stream: branchName
  })
})

router.get('/mod/:modname/:modversion?', (req, res) => {
  // Found mod
  res.json({
    id: 0,
    name: 'example',
    pretty_name: 'Example',
    author: 'ExampleAuthor',
    description: 'This is the description',
    link: 'https://example.com/',
    versions: [
      '1.20.1-0.0.1',
      '1.20.1-0.0.2'
    ]
  })

  // Found mod version
  res.json({
    id: 0,
    md5: '51c1305b56249804926e38fcf3e46640',
    filesize: 0,
    url: 'https://example.com/file.zip'
  })

  // Version Not Found
  // res.status(404).json({
  //   "error": "Mod version does not exist"
  // })

  // Mod Not Found
  // res.status(404).json({
  //   "error": "Mod does not exist"
  // })
})

router.get('/modpack', (req, res) => {
  // Modpack Index
  res.json({
    modpacks: {
      slug: 'Example Modpack Pretty Name'
    },
    mirror_url: `http://${process.env.HOST}/mods`
  })
})

router.get('/modpack/:slug/:build?', (req, res) => {
  // With Slug
  res.json({
    name: 'examplepack',
    display_name: 'Example Pack',
    recommended: '0.0.1',
    latest: '0.0.2',
    builds: [
      '0.0.1',
      '0.0.2'
    ]
  })

  // Build found
  res.json({
    minecraft: '1.20.1',
    forge: null,
    java: 17,
    memory: 2048,
    mods: [
      {
        name: 'examplemod',
        version: '0.0.1',
        md5: '51c1305b56249804926e38fcf3e46640',
        url: 'https://example.com/file.zip',
        filesize: 0
      }
    ]
  })

  // Build Not Found
  // res.status(404).json({
  //   "error": "Build does not exist"
  // })

  // Modpack Not Found
  // res.status(404).json({
  //   "error": "Modpack does not exist"
  // })
})

router.get('/verify/:key?', (req, res) => {
  let api_key = req.params?.key

  if (api_key !== undefined) {
    if (api_key === process.env?.API_KEY)
      // Key validated
      res.json({
        valid: 'Key validated.',
        name: 'API KEY',
        created_at: 'A long time ago'
      })
    else {
      // Invalid key provided
      res.json({
        error: 'Invalid key provided.'
      })
    }
  } else {
    // No key provided
    res.json({
      error: 'No API key provided.'
    })
  }
})

/* Invalid API Routes */
router.all('*', (req, res) => {
  res.status(405).json({
    code: res.statusCode,
    message: 'Invalid route.'
  })
})

module.exports = router
