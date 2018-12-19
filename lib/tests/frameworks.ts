import chai from 'chai'
import sinonSpies from 'sinon'
import sinonChai from 'sinon-chai'

chai.should()
chai.use(sinonChai)

let { expect } = chai
let sinon = sinonSpies

export { expect, sinon }
