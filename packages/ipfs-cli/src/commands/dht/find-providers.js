import parseDuration from 'parse-duration'
import { coerceCID } from '../../utils.js'

export default {
  command: 'findprovs <key>',

  describe: 'Find peers that can provide a specific value, given a key.',

  builder: {
    key: {
      type: 'string',
      coerce: coerceCID
    },
    'num-providers': {
      alias: 'n',
      describe: 'The number of providers to find. Default: 20.',
      default: 20,
      type: 'number'
    },
    timeout: {
      type: 'string',
      coerce: parseDuration
    }
  },

  /**
   * @param {object} argv
   * @param {import('../../types').Context} argv.ctx
   * @param {import('multiformats/cid').CID} argv.key
   * @param {number} argv.numProviders
   * @param {number} argv.timeout
   */
  async handler ({ ctx: { ipfs, print }, key, numProviders, timeout }) {
    for await (const prov of ipfs.dht.findProvs(key, {
      numProviders,
      timeout
    })) {
      print(prov.id.toString())
    }
  }
}
