const express = require('express')
const rateLimit = require('express-rate-limit')
const MongoStore = require('rate-limit-mongo')
const database = require('../database/database')
const branchName = require('current-git-branch')() || 'release'
const pckg = require('../package.json')
const router = express.Router()

// --- Rate Limiter ---
const maxRequests = process.env.API_RATE_REQUESTS || 1000
const rateWindow = process.env.API_RATE_WINDOW || 60000

const limiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_CONN_STRING,
    collectionName: 'technicflux_ratelimit',
    expireTimeMs: rateLimit,
    errorHandler: console.error.bind(null, 'rate-limit-mongo')
  }),
  max: maxRequests,
  windowMs: rateWindow,
  legacyHeaders: true,
  message: { error: 'Too many requests from this IP. You are being rate-limited.' }
})
router.use(limiter)

// --- Module Error Functions ---

function error500 (res) {
  return res.status(500).json({
    error: 'Internal Server Error'
  })
}

// --- API Routes ---

/**
 * Base API Route : /api/
 * Possible Statuses: 200
 * Purpose: Displays information about the TechnicFlux Solder API.
 */
router.get('/', (req, res) => {
  return res.json({
    api: pckg.prettyName,
    version: pckg.version,
    stream: branchName,
    meta: {
      description: "TechnicFlux implementation of Technic's Solder API for retrieval of modpack and mod info.",
      license: `https://github.com/Zandercraft/TechnicFlux/blob/${branchName}/LICENSE.txt`,
      repo: 'https://github.com/Zandercraft/TechnicFlux',
      documentation: 'https://github.com/Zandercraft/TechnicFlux/wiki',
      attribution: {
        name: 'Zandercraft',
        github: 'https://github.com/Zandercraft',
        website: 'https://zandercraft.ca'
      }
    }
  })
})

/**
 * Mod API Route : /api/mod/:modname/:modversion?
 * Possible Statuses: 200, 404, 500
 * Purpose: Displays information about a mod or a specific version of that mod.
 */
router.get('/mod/:modname/:modversion?', (req, res) => {
  const modName = req.params.modname
  const modVersion = req.params?.modversion

  return database.mod.getModBySlug(`${modName}`).then((mod) => {
    // Check if a mod was found
    if (mod === null) {
      // Mod Not Found
      return res.status(404).json({
        error: 'Mod does not exist'
      })
    } else if (modVersion === undefined) {
      // Request is for the mod's info.
      return res.json(mod)
    } else {
      // Request is for a particular version.
      return database.mod.getModVersion(modName, modVersion).then((version) => {
        if (version === null) {
          // Version Not Found
          return res.status(404).json({
            error: 'Mod version does not exist'
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
        return error500(res)
      })
    }
  }).catch(() => {
    // Issue with db request
    return error500(res)
  })
})

/**
 * Modpack Index API Route : /api/modpack/
 * Possible Statuses: 200, 500
 * Purpose: Displays a list of all modpacks that are on this TechnicFlux instance.
 */
router.get('/modpack', (req, res) => {
  return database.modpack.getAllModpacks().then((modpacks) => {
    // Modpack Index
    return res.json({
      modpacks: (modpacks === null)
        ? {}
        : modpacks.reduce((obj, item) => {
          obj[item.name] = String(item.display_name)
          return obj
        }, {}),
      mirror_url: `http://${process.env.HOST}/mods/`
    })
  }).catch(() => {
    // Issue with db request
    return error500(res)
  })
})

/**
 * Modpack API Route : /api/modpack/:modpack/:build?
 * Possible Statuses: 200, 404, 500
 * Purpose: Displays information about a modpack or a specific build of that modpack.
 */
router.get('/modpack/:slug/:build?', (req, res) => {
  const slug = req.params.slug
  const build = req.params?.build

  return database.modpack.getModpackBySlug(`${slug}`).then((modpack) => {
    if (modpack === null) {
      // Modpack Not Found
      return res.status(404).json({
        error: 'Modpack does not exist'
      })
    } else if (build === undefined) {
      // Modpack info
      return res.json({
        name: modpack.name,
        display_name: modpack.display_name,
        recommended: modpack.recommended,
        latest: modpack.latest,
        builds: modpack.builds.map((mBuild) => mBuild.version)
      })
    } else {
      // Modpack build info
      return database.build.getModpackBuild(`${slug}`, `${build}`).then((mBuild) => {
        if (mBuild !== undefined) {
          // Build found
          return res.json({
            minecraft: mBuild.minecraft,
            forge: null,
            java: mBuild.java,
            memory: mBuild.memory,
            mods: mBuild.mods.map((mod) => {
              return {
                name: mod.name,
                version: mod.version,
                md5: mod.md5,
                url: mod.link,
                filesize: 0
              }
            })
          })
        } else {
          // Build Not Found
          res.status(404).json({
            error: 'Build does not exist'
          })
        }
      })
    }
  }).catch(() => {
    // Issue with db request
    return error500(res)
  })
})

/**
 * API Key Verification Route : /api/verify/:key?
 * Possible Statuses: 200, 400, 403
 * Purpose: Checks if the given API key is valid with this instance of TechnicFlux
 */
router.get('/verify/:key?', (req, res) => {
  const apiKey = req.params?.key

  if (apiKey !== undefined) {
    database.apiKey.authAPIKey(apiKey).then((key) => {
      if (apiKey === process.env?.API_KEY) {
        // Key validated
        return res.json({
          valid: 'Key validated.',
          name: 'API KEY',
          created_at: 'A long time ago'
        })
      } else if (key[0] === true) {
        // Key validated
        return res.json({
          valid: 'Key validated.',
          name: key[1].name,
          created_at: key[1].created_at
        })
      } else {
        // Invalid key provided
        return res.status(403).json({
          error: 'Invalid key provided.'
        })
      }
    })
  } else {
    // No key provided
    return res.status(400).json({
      error: 'No API key provided.'
    })
  }
})

/**
 * Invalid API Routes : /api/<invalid route>
 * Possible Statuses: 405
 * Purpose: Displays an error when an invalid route is called.
 */
router.all('*', (req, res) => {
  return res.status(405).json({
    code: res.statusCode,
    message: 'Invalid route.'
  })
})

module.exports = router
