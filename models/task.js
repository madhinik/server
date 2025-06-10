const { Schema, model } = require('mongoose');

const TaskExecutionSchema = new Schema({
  startTime: { type: Date, required: true },
  endTime:   { type: Date, required: true },
  output:    { type: String, required: true }
});

const TaskSchema = new Schema({
  id:            { type: String, required: true, unique: true },
  name:          { type: String, required: true },
  owner:         { type: String, required: true },
  command:       { type: String, required: true },
  taskExecutions:[ TaskExecutionSchema ]
});

module.exports = model('Task', TaskSchema);