import { loadEnvironment } from '../src/config/environment.js';

loadEnvironment();
process.stdout.write('Environment configuration is valid.\n');
