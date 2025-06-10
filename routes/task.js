const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const { exec } = require('child_process');

// Helper: validate command (no pipes, redirects, &&, ; etc.)
function isValidCommand(cmd) {
  // Allow simple commands: alphanumeric, spaces, dashes, underscores, dots
  const regex = /^[a-zA-Z0-9_\-\.\s]+$/;
  return regex.test(cmd);
}

// GET /tasks and GET /tasks/:id
router.get('/', async (req, res, next) => {
  try {
    const { id } = req.query;console.log(id);
    
    if (id) {
      const task = await Task.findOne({ id });
      if (!task) return res.status(404).json({ error: 'Task not found' });
      return res.json(task);
    }
    console.log('TASKS');
    
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /tasks/search?name=<str>
router.get('/search', async (req, res, next) => {
  try {
    const { name } = req.query;console.log('NAME',name);
    
    if (!name) return res.status(400).json({ error: 'Name query required' });
    const tasks = await Task.find({ name: new RegExp(name, 'i') });
    if (!tasks.length) return res.status(404).json({ error: 'No tasks found' });

  } catch (err) {
    next(err);
  }
});

// PUT /tasks - create or update
router.put('/', async (req, res, next) => {
  try {
    const { id, name, owner, command } = req.body;
    
    if (!id || !name || !owner || !command) {
      return res.status(400).json({ error: 'id, name, owner, and command are required' });
    }
    if (!isValidCommand(command)) {
      return res.status(400).json({ error: 'Invalid or unsafe command' });
    }
    const task = await Task.findOneAndUpdate(
      { id },
      { id, name, owner, command },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Task.deleteOne({ id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

// PUT /tasks/:id/executions - run command, record execution
router.put('/:id/executions', async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (!isValidCommand(task.command)) {
      return res.status(400).json({ error: 'Task command is invalid or unsafe' });
    }

    const startTime = new Date();
    exec(task.command, { timeout: 60 * 1000 }, async (error, stdout, stderr) => {
      const endTime = new Date();
      const output = error ? stderr || error.message : stdout;

      const execution = { startTime, endTime, output };
      task.taskExecutions.push(execution);
      await task.save();

      res.json(execution);
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
