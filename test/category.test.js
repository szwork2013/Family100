/**
 * Author: VincentBel
 * Date: 15/10/15
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
const Product = mongoose.model('Product');
const Category = mongoose.model('Category');

let count;
let parentCategoryId;


/**
 * Product tests
 */
describe('Categories', () => {

  describe('POST /categories', () => {

    describe('Invalid parent category id', () => {

      before(done => {
        Category.count(function (err, cnt) {
          count = cnt;
          done();
        })
      });

      it('should respond with error', done => {
        agent
          .post('/categories')
          .set('Content-Type', 'application/json')
          .send({
            name: '水电改造',
            image: faker.image.fashion(40, 40),
            description: faker.lorem.paragraph(),
            parentId: 'sadfsadsafd'
          })
          .expect('Content-Type', /application\/json/)
          .expect(function (res) {
            var body = res.body;
            if (body.data) {
              return 'should not contain data field';
            }

            if (!body.error || body.error.message !== 'parent Id is not valid') {
              return 'error message not match';
            }
          })
          .end(done)
      });

      it('should not save to the database', function (done) {
        Category.count(function (err, cnt) {
          count.should.equal(cnt);
          done();
        })
      })
    });

    describe('Valid parameter', () => {

      before(() => {
        const category = new Category({
          name: '水电类',
          image: faker.image.fashion(40, 40),
          description: faker.lorem.paragraph()
        });

        return category.save()
          .then(category => parentCategoryId = category._id)
          .then(() => Category.count().exec())
          .then(cnt => {
            count = cnt;
          });
      });

      it('should respond with success', done => {
        agent
          .post('/categories')
          .set('Content-Type', 'application/json')
          .send({
            name: '水电改造',
            image: faker.image.fashion(40, 40),
            description: faker.lorem.paragraph(),
            parentId: parentCategoryId
          })
          .expect(200)
          .expect(function (res) {
            var body = res.body;
            if (body.error) {
              return 'should not contain error field';
            }

            if (!body.data || body.data.name !== '水电改造') {
              return 'name not match';
            }
          })
          .end(done)
      });

      it('should insert a record to the database', done => {
        Category.count(function (err, cnt) {
          cnt.should.equal(count + 1);
          done();
        })
      });

      it('should save the category to the database', () => {
        return Category.findOne({name: '水电改造'}).exec()
          .then(category => {
            category.should.be.an.instanceOf(Category);
            category.name.should.equal('水电改造');
            return category._id;
          }).then(subCategoryId =>
            Category.findOne({
              name: '水电类',
              subCategories: subCategoryId
            }).exec()
        ).then(category => {
            category.should.be.an.instanceOf(Category);
            category.name.should.equal('水电类');
          });
      });
    });
  });

  after(() => {
    return clearDb();
  })
});
