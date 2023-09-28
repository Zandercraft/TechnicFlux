const express = require('express')
const pckg = require('../package.json')
const branchName = require('current-git-branch')() || "release"
const database = require('../database')
const router = express.Router()

router.get('/', (req, res) => {
  return res.json({
    api: pckg.prettyName,
    version: pckg.version,
    stream: branchName,
    meta: {
      description: "TechnicFlux implementation of Technic's Solder API for retrieval of modpack and mod info.",
      license: `https://github.com/Zandercraft/TechnicFlux/blob/${branchName}/LICENSE.txt`,
      repo: "https://github.com/Zandercraft/TechnicFlux",
      documentation: "https://github.com/Zandercraft/TechnicFlux/wiki",
      attribution: {
        name: "Zandercraft",
        github: "https://github.com/Zandercraft",
        website: "https://zandercraft.ca",
      }
    }
  })
})

router.get('/mod/:modname/:modversion?', (req, res) => {
  let modName = req.params.modname
  let modVersion = req.params?.modversion

  return database.getModBySlug(`${modName}`).then((mod) => {
    // Check if a mod was found
    if (mod === null) {
      // Mod Not Found
      return res.status(404).json({
        "error": "Mod does not exist"
      })
    } else if (modVersion === undefined) {
      // Request is for the mod's info.
      return res.json(mod)
    } else {
      // Request is for a particular version.
      return database.getModVersion(modName, modVersion).then((version) => {
        if (version === null) {
          // Version Not Found
          return res.status(404).json({
            "error": "Mod version does not exist"
          })
        } else {
          // Found mod version
          return res.json({
            id: version.mod_id,
            md5: version.md5,
            filesize: version.filesize,
            url: version.url
          })
        }
      }).catch(() => {
        // Issue with db request
        return res.status(500).json({
          "error": "Internal Server Error"
        })
      })
    }
  }).catch(() => {
    // Issue with db request
    return res.status(500).json({
      "error": "Internal Server Error"
    })
  })
})

router.get('/modpack', (req, res) => {
  return database.getAllModpacks().then((modpacks) => {
    // Modpack Index
    return res.json({
      modpacks: (modpacks === null) ? {} : modpacks.reduce((obj, item) => {
        obj[item['name']] = String(item['display_name'])
        return obj
      }, {}),
      mirror_url: `http://${process.env.HOST}/mods/`
    })
  }).catch(() => {
    // Issue with db request
    return res.status(500).json({
      "error": "Internal Server Error"
    })
  })
})

router.get('/modpack/:slug/:build?', (req, res) => {
  let slug = req.params.slug
  let build = req.params?.build

  return database.getModpackBySlug(`${slug}`).then((modpack) => {
    if (modpack === null) {
      // Modpack Not Found
      return res.status(404).json({
        "error": "Modpack does not exist"
      })
    } else if (build === undefined) {
      // Modpack info
      return res.json({
        name: modpack.name,
        display_name: modpack.display_name,
        recommended: modpack.recommended,
        latest: modpack.latest,
        builds: modpack.builds.map((build) => build['version'])
      })
    } else {
      // Modpack build info

      // Build found
      return res.json({
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
    }
  }).catch(() => {
    // Issue with db request
    return res.status(500).json({
      "error": "Internal Server Error"
    })
  })
})

router.get('/verify/:key?', (req, res) => {
  let api_key = req.params?.key

  if (api_key !== undefined) {
    if (api_key === process.env?.API_KEY)
      // Key validated
      return res.json({
        valid: 'Key validated.',
        name: 'API KEY',
        created_at: 'A long time ago'
      })
    else {
      // Invalid key provided
      return res.json({
        error: 'Invalid key provided.'
      })
    }
  } else {
    // No key provided
    return res.json({
      error: 'No API key provided.'
    })
  }
})

/* Invalid API Routes */
router.all('*', (req, res) => {
  return res.status(405).json({
    code: res.statusCode,
    message: 'Invalid route.'
  })
})

module.exports = router
