// src/utils/delay.js

import { promisify } from 'util';

export const delay = promisify(setTimeout);