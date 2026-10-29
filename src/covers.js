// Live projects on GitHub Pages. Covers are screenshots of each site, shot at the shape of its card.
const live = (id) => `https://shahamck.github.io/${id}-site/`;
const repo = (id) => `https://github.com/shahamck/${id}-site`;

export const projects = [
  { id: 'malola', name: 'POV: by Maison Malola', title: 'POV: by Maison Malola — a perfume house told as a scroll story', desc: 'Three bottles, one room. A chaptered scroll story for a fragrance label’s first collection.', tags: ['Client', 'Web design', 'Development'], span: 'a' },
  { id: 'cubesat', name: 'What are CubeSats', title: 'What are CubeSats — a nanosatellite explained in 3D', desc: 'A NASA × B1T scroll story with a live, exploded Three.js satellite and callouts for every part.', tags: ['Concept', 'WebGL', 'Scroll story'], span: 'b' },
  { id: 'ninja', name: 'NinjaPizza', title: 'NinjaPizza — wood-fired pizza, delivered at ninja speed', desc: 'A loud, illustrated brand site with hand-drawn pizzas and an order flow that keeps up.', tags: ['Web design', 'Development'], span: 'c' },
  { id: 'its', name: 'Innovative Testing Solution', title: 'Innovative Testing Solution — everything a lab runs on', desc: 'Product catalogue and quote requests for a lab supplier in Saudi Arabia and the UAE, with a 3D well-plate hero.', tags: ['Client', 'Development', 'Catalogue'], span: 'd' },
  { id: 'alcove', name: 'ALCOVE', title: 'ALCOVE — an interior studio you fly into', desc: 'A luxury interiors site that opens by flying through the O of its own wordmark.', tags: ['Concept', 'Web design', 'Motion'], span: 'e' },
  { id: 'tise', name: 'TISE', title: 'TISE — smart solar for every home', desc: 'A brand site for a solar app, built around procedural 3D houses and a full day-to-night cycle.', tags: ['Concept', '3D', 'Development'], span: 'f' },
  { id: 'mintly', name: 'Mintly', title: 'Mintly — a calmer dental clinic', desc: 'Clinic site with live opening hours, services and online booking.', tags: ['Web design', 'Development'], span: 'g' },
  { id: 'subtle', name: 'subtle.', title: 'subtle. — a storefront for handmade furniture', desc: 'Concept e-commerce for Subtle Concepts, built on their real catalogue.', tags: ['E-commerce', 'Concept'], span: 'g' },
  { id: 'learnify', name: 'Learnify', title: 'Learnify — find the right course', desc: 'Landing page for an online-courses platform, with illustrated recommendations.', tags: ['Landing page', 'Web design'], span: 'g' },
].map((p) => ({ ...p, url: live(p.id), repo: repo(p.id), img: `./work/${p.id}.jpg` }));
