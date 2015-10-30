/**
 * Author: VincentBel
 * Date: 15/10/30
 */

import KuJiaLe from '../libs/kujiale';
import should from 'should';
import request from 'supertest';
import app from '../app';
import Promise from 'bluebird';
import config from '../config/config';
const agent = request.agent(app);

var kujiale = new KuJiaLe({
  appkey: config.kjlAppKey,
  appsecret: config.kjlAppSecret
});

describe('Ku Jia Le Api', () => {

  describe('create user', done => {
    it('should response with token', () => {
      return kujiale.createUser({
        id: 'sjadflkj12ljkkljsdf',
        name: 'Vincent Bel',
        phoneNumber: 18001292902
      }).then(result => {
        console.log(result);
        result.should.have.property('token');
      });
    })
  })
});
