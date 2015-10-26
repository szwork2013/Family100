/**
 * Author: VincentBel
 * Date: 15/10/15
 */

import mongoose from 'mongoose';
import Promise from 'bluebird';
const User = mongoose.model('User');
const Product = mongoose.model('Product');
const Category = mongoose.model('Category');
const Variant = mongoose.model('Variant');

/**
 * Clear database
 */
export function clearDb() {
  return Promise.all([
    User.remove().exec(),
    Product.remove().exec(),
    Category.remove().exec(),
    Variant.remove().exec()
  ]);
}

export function generateArray(lengh, generate) {
  var arr = [];
  for (var i = 0; i < lengh; ++i) {
    arr.push(generate());
  }
  return arr;
}
