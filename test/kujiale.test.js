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

var loginOptions = {
  id: 'sjadflkj12ljkkljsdf',
  name: 'Vincent Bel',
  phoneNumber: 18001292902
};

describe('Ku Jia Le Api', () => {

  describe('create user', done => {
    it('should response with token', () => {
      return kujiale.getLoginUrl(loginOptions)
        .then(result => {
          console.log(result);
          result.should.have.property('token');
        });
    })
  });

  describe('create a design', done => {
    it('should response with ...', () => {
      return kujiale.createDesignAndGetLoginUrl(loginOptions, '3FO4KHX67C2F', '上海_万科红郡');
    })
  });
});
