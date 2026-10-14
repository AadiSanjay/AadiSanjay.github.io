import './style.css';
import { projects } from './projects.js';
import { mountGallery } from './gallery.js';

mountGallery(document.querySelector('#work'), projects);
