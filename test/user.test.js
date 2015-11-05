/**
 * Author: VincentBel
 * Date: 15/10/26
 */

import mongoose from 'mongoose';
import should from 'should';
import request from 'supertest';
import app from '../app';
import faker from 'faker';
import Promise from 'bluebird';
import { clearDb, generateArray } from './helper'
const context = describe;
const agent = request.agent(app);
const User = mongoose.model('User');

var YunPian = require('../libs/yunpian');
var config = require('../config/config');

let count;

const body = {
  name: 'wo',
  phoneNumber: '11111111111',
  city: '上海市',
  county: '静安区',
  apartmentQuery: '万科尚源',
  apartment: {
    obsPlanId: '3FO4K5XCWF92',
    obsCommId: '3FO4K4W468WE',
    obsUserId: '3FO4K57DX55A',
    areaId: 39,
    commName: '<span class=\'light-word\'>万科尚源</span>',
    cityId: 39,
    planCity: '上海',
    area: 71,
    name: '万科尚源户型图89平户型图 3室2厅1卫1厨',
    specName: '三居',
    pics: 'http://qhyxpic.oss.kujiale.com/fpimgnew/2015/07/14/VaRbFQqHGHxBMQAAAAg_800x800.jpg',
    formatModifiedTime: '3个月前',
    modifiedTime: 1437548579000,
    srcArea: 89,
    copyedTimes: 11,
    isSelfUpload: false,
    realArea: 59.07,
    specId: 3111,
    smallPics: 'http://qhyxpic.oss.kujiale.com/fpimgnew/2015/07/14/KWSFWHQK7PZCC5THAAAAABA81855reside_400x400.jpg'
  }
};

/**
 * Users tests
 */
describe('Users', () => {

  describe('POST /register', () => {

    describe('Valid parameter', () => {

      before(() => {
        return User.count().exec()
          .then(cnt => {
            count = cnt;
          });
      });

      it('should respond with success', done => {
        agent
          .post('/register')
          .set('Content-Type', 'application/json')
          .send(body)
          .expect(200)
          .expect(function (res) {
            var body = res.body;
            if (body.error) {
              console.log(body.error);
              throw new Error('should not contain error field');
            }

            if (!body.data || body.data.phoneNumber !== '11111111111') {
              throw new Error('phone number not match');
            }

            if (!body.data || body.data.token) {
              throw new Error('should response with a token');
            }
          })
          .end(done)
      });

      it('should insert a record to the database', done => {
        User.count(function (err, cnt) {
          cnt.should.equal(count + 1);
          done();
        })
      });

      it('should save the user to the database', () => {
        return User.findOne({phoneNumber: '11111111111'}).exec()
          .then(user => {
            user.should.be.an.instanceOf(User);
            user.phoneNumber.should.equal('11111111111');
          });
      });
    });
    describe('Invalid parameter: duplicate phone number', () => {

      before(done => {
        User.count(function (err, cnt) {
          count = cnt;
          done();
        })
      });

      it('should respond with error', done => {
        agent
          .post('/register')
          .set('Content-Type', 'application/json')
          .send(body)
          .expect(200)
          .expect(function (res) {
            var body = res.body;
            if (body.data) {
              throw new Error('should not contain data field');
            }

            if (!body.error) {
              throw new Error('should contain error filed');
            }

            console.log(body.error);
          })
          .end(done)
      });

      it('should not save to the database', function (done) {
        User.count(function (err, cnt) {
          count.should.equal(cnt);
          done();
        })
      })
    });
  });


  describe('POST /users/sms', () => {
    describe('Valid parameter', () => {
      it('should respond with success', done => {
        agent
          .post('/users/sms')
          .send({phoneNumber: '18001292901'})
          .expect(200)
          .expect(function (res) {
            var body = res.body;
            if (body.error) {
              console.log(body.error);
              throw new Error('should not contain error field');
            }

            if (!body.data || body.data.success !== true) {
              throw new Error('should response with success');
            }
          })
          .end(done);
      })
    });

    describe('request more than twice with the same ip', () => {

      var firstSendTime;

      before(done => {
        firstSendTime = Date.now();
        agent
          .post('/users/sms')
          .send({phoneNumber: '18001292901'})
          .expect(200)
          .end(done);
      });

      it('should be block', done => {
        console.log(`interval time: ${Date.now() - firstSendTime} ms`);
        agent
          .post('/users/sms')
          .send({phoneNumber: '18001292901'})
          .expect(200)
          .expect(function (res) {
            var body = res.body;
            if (body.data) {
              console.log(body.data);
              throw new Error('should not contain data field');
            }
            console.log(body.error);
          })
          .end(done);
      })
    });
  });

  after(() => {
    return clearDb()
  })
});
