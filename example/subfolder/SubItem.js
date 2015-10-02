
/**
 * @model SubItem
 **/

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var SubItemSchema = new Schema({
  id         : { 'type' : ObjectId },
  name       : { 'type' : String },
  count      : { 'type' : Number, 'default' : 0 },
  created_at : { 'type' : Date, 'default' : Date.now }
});

var SubItem = exports.SubItem = mongoose.model('SubItem', SubItemSchema);

/* EOF */