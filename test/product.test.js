/**
 * Author: VincentBel
 * Date: 15/10/14
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
const Variant = mongoose.model('Variant');

let count;
let testProduct;


/**
 * Product tests
 */
describe('Products', () => {

  //it("should save 100 fake products", () => {
  //  var products = generateArray(100, () => new Product({
  //    title: faker.name.findName(),
  //    active: faker.random.boolean(),
  //    cost: faker.commerce.price(50, 200),
  //    price: faker.commerce.price(200, 500),
  //    salePrice: faker.commerce.price(200, 400),
  //    images: generateArray(8, () => ({
  //      caption: faker.commerce.productAdjective(),
  //      url: faker.image.fashion(600, 800)
  //    })),
  //    description: faker.lorem.paragraph()
  //  }).save());
  //
  //  return Promise
  //    .all(products)
  //    .then(() => Product.count().exec())
  //    .then(count => {
  //      count.should.equal(100);
  //    })
  //});

  //describe('GET /products', function () {
  //  it('should respond with Content-Type text/html', function (done) {
  //    agent
  //      .get('/articles')
  //      .expect('Content-Type', /html/)
  //      .expect(200)
  //      .expect(/Articles/)
  //      .end(done)
  //  })
  //})

  //describe('GET /articles/new', function () {
  //  context('When not logged in', function () {
  //    it('should redirect to /login', function (done) {
  //      agent
  //        .get('/articles/new')
  //        .expect('Content-Type', /plain/)
  //        .expect(302)
  //        .expect('Location', '/login')
  //        .expect(/Moved Temporarily/)
  //        .end(done)
  //    })
  //  })
  //
  //  context('When logged in', function () {
  //    before(function (done) {
  //      // login the user
  //      agent
  //        .post('/users/session')
  //        .field('email', 'foobar@example.com')
  //        .field('password', 'foobar')
  //        .end(function (err) {
  //          done()
  //        })
  //    })
  //
  //    it('should respond with Content-Type text/html', function (done) {
  //      agent
  //        .get('/articles/new')
  //        .expect('Content-Type', /html/)
  //        .expect(200)
  //        .expect(/New Article/)
  //        .end(done)
  //    })
  //  })
  //})

  describe('POST /products', () => {

    describe('Invalid parameter', () => {

      before(done => {
        Product.count(function (err, cnt) {
          count = cnt;
          done();
        })
      });

      it('should respond with error', done => {
        agent
          .post('/products')
          .set('Content-Type', 'application/json')
          .send({
            title: '',
            active: faker.random.boolean(),
            cost: faker.commerce.price(50, 200),
            price: faker.commerce.price(200, 500),
            salePrice: faker.commerce.price(200, 400),
            images: generateArray(8, () => ({
              caption: faker.commerce.productAdjective(),
              url: faker.image.fashion(600, 800)
            })),
            description: faker.lorem.paragraph()
          })
          .expect('Content-Type', /application\/json/)
          .expect(function (res) {
            var body = res.body;
            if (body.data) {
              throw new Error('should not contain data field');
            }

            console.log(body.error);
            if (!body.error) {
              throw new Error('should contain error field');
            }
          })
          .end(done)
      });

      it('should not save to the database', function (done) {
        Product.count(function (err, cnt) {
          count.should.equal(cnt);
          done();
        })
      })
    });

    describe('Valid parameter', () => {

      before(() => {
        return Product.count().exec()
          .then(cnt => {
            count = cnt;
          });
      });

      it('should respond with success', done => {
        agent
          .post('/products')
          .set('Content-Type', 'application/json')
          .send({
            title: 'Man Autumn T-shirt',
            active: faker.random.boolean(),
            cost: faker.commerce.price(50, 200),
            price: faker.commerce.price(200, 500),
            salePrice: faker.commerce.price(200, 400),
            images: generateArray(8, () => ({
              caption: faker.commerce.productAdjective(),
              url: faker.image.fashion(600, 800)
            })),
            options: [{
              name: 'Color',
              variantKey: 'color',
              order: 0,
              values: ['Green', 'Yellow']
            }, {
              name: 'Size',
              variantKey: 'size',
              order: 1,
              values: ['S', 'M']
            }],
            variants: [{
              name: 'Man Autumn T-shirt Green-S',
              price: 100,
              active: true,
              image: faker.image.fashion(600, 800),
              options: {
                color: 'Green',
                size: 'S'
              }
            }, {
              name: 'Man Autumn T-shirt Green-M',
              price: 110,
              active: true,
              image: faker.image.fashion(600, 800),
              options: {
                color: 'Green',
                size: 'M'
              }
            }, {
              name: 'Man Autumn T-shirt Yellow-S',
              price: 120,
              active: true,
              image: faker.image.fashion(600, 800),
              options: {
                color: 'Yellow',
                size: 'S'
              }
            }, {
              name: 'Man Autumn T-shirt Yellow-M',
              price: 130,
              active: true,
              image: faker.image.fashion(600, 800),
              options: {
                color: 'Yellow',
                size: 'M'
              }
            }],
            description: faker.lorem.paragraph()
          })
          .expect(200)
          .expect(function (res) {
            var body = res.body;
            if (body.error) {
              throw new Error('should not contain error field');
            }

            if (!body.data || body.data.title !== 'Man Autumn T-shirt') {
              throw new Error('title not match');
            }
          })
          .end(done)
      });

      it('should insert a record to the database', done => {
        Product.count(function (err, cnt) {
          cnt.should.equal(count + 1);
          done();
        })
      });

      it('should save the product and 4 variants to the database', () => {
        return Product.findOne({title: 'Man Autumn T-shirt'}).populate('variant').exec()
          .then(product => {
            product.should.be.an.instanceOf(Product);
            product.title.should.equal('Man Autumn T-shirt');
            product.variants.length.should.equal(4);
            testProduct = product;
          });
      });
    });
  });

  //describe(`POST /${testProduct._id}/variants`, () => {
  //  describe('Invalid parameter', done => {
  //    agent.post(`/products/${testProduct._id}/variants`)
  //      .set('Content-Type', 'application/json')
  //      .send({})
  //      .expect(200)
  //      .expect(res => {
  //        var body = res.body;
  //        if (body.error) {
  //          return 'should not contain error field';
  //        }
  //
  //        if (!body.data || body.data.title !== 'Man Autumn T-shirt') {
  //          return 'title not match';
  //        }
  //      })
  //      .end(done);
  //  });
  //});

  after(() => {
    return clearDb()
  })
});
