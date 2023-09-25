const express = require('express')
const pckg = require('../package.json')
const branchName = require('current-git-branch');
const router = express.Router()

router.get('/', (req, res) => {
  res.json({
    "api": pckg.prettyName,
    "version": pckg.version,
    "stream": branchName()
  })
})

router.get('/mod/:modname', (req, res) => {
  // Found
  res.json({
    "id": 0,
    "name": "example",
    "pretty_name": "Example",
    "author": "ExampleAuthor",
    "description": "This is the description",
    "link": "https://example.com/",
    "versions": [
      "1.20.1-0.0.1",
      "1.20.1-0.0.2"
    ]
  })

  // Not Found
  // res.status(404).json({
  //   "error": "Mod does not exist"
  // })
})

router.get('/mod/:modname/:modversion', (req, res) => {
  // Found
  res.json({
    "id": 0,
    "md5": "51c1305b56249804926e38fcf3e46640",
    "filesize": 0,
    "url": "https://example.com/file.zip",
  })

  // Mod Not Found
  // res.status(404).json({
  //   "error": "Mod does not exist"
  // })

  // Version Not Found
  // res.status(404).json({
  //   "error": "Mod version does not exist"
  // })
})

router.get('/modpack', (req, res) => {
  // No Slug
  res.json({
    "modpacks": {
      "test": "Example Modpack"
    },
    "mirror_url": "https://example.com/"
  })
})

router.get('/modpack/:slug', (req, res) => {
  // With Slug
  res.json({
    "name": "examplepack",
    "display_name": "Example Pack",
    "recommended": "0.0.1",
    "latest": "0.0.2",
    "builds": [
      "0.0.1",
      "0.0.2"
    ]
  })

  // Modpack Not Found
  // res.status(404).json({
  //   "error": "Modpack does not exist"
  // })
})

router.get('/modpack/:slug/:build', (req, res) => {
  // Build found
  res.json({
    "minecraft": "1.20.1",
    "forge": null,
    "java": 17,
    "memory": 2048,
    "mods": [
      {
        "name": "examplemod",
        "version": "0.0.1",
        "md5": "51c1305b56249804926e38fcf3e46640",
        "url": "https://example.com/file.zip",
        "filesize": 0
      }
    ]
  })


  // Modpack Not Found
  // res.status(404).json({
  //   "error": "Modpack does not exist"
  // })

  // Build Not Found
  // res.status(404).json({
  //   "error": "Build does not exist"
  // })
})

module.exports = router
