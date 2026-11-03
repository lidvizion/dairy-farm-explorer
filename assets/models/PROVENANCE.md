# Model provenance

Generated with Meshy text-to-3D (model "latest", preview then refine with PBR maps, `texture_resolution: 4k`, `remove_lighting: true`). The High tier keeps 4096px maps for the hero cow and 2048px for everything else (the farm alone loads 12 models; at 4K they would need about 1 GB of video memory); the Lite tier uses 1024px maps. Prompts and texture prompts are in `scripts/asset-briefs.json`. Raw downloads live in the ignored `.meshy/raw/` folder; `npm run models:optimize` rebuilds these files from them.

Credits: a preview costs 20 and a 4K refine 10. The hay bale's first preview was rejected (it read as a loose straw bundle) and regenerated once.

| Asset | Preview task | Refine task | Credits | High | Lite |
|---|---|---|---|---|---|
| `holstein-cow` | `01a19ef0-6ce3-7263-b36f-227bf93578e7` | `01a19ef1-33f9-7460-891b-fdcfde7c064a` | 30 | 4.6 MB | 0.38 MB |
| `dairy-barn` | `01a19ef0-740a-77e1-a816-050f0b1ee806` | `01a19ef2-8e6b-7288-bc63-363b084b6c03` | 30 | 2.3 MB | 0.32 MB |
| `milk-tanker` | `01a19ef0-7c36-7542-93e4-7adea09813e5` | `01a19ef1-9ffc-75ea-b1b3-0de3dabca1ae` | 30 | 2.1 MB | 0.70 MB |
| `milk-tank` | `01a19ef0-83cf-74dc-8851-1a07de85ba8c` | `01a19ef1-3b01-747b-83fc-11a815ffad1d` | 30 | 1.2 MB | 0.27 MB |
| `valley-oak` | `01a19ef0-8b97-76d8-baa0-2c075fc2e272` | `01a19ef2-9650-71bd-bd3e-5cd5758d0787` | 30 | 1.6 MB | 0.33 MB |
| `hay-bale` | `01a19ef6-c07d-7656-9384-0095d7badb1c` | `01a19f01-5720-7602-b285-fc5a34b732f9` | 50 | 1.5 MB | 0.37 MB |
| `dairy-display` | `01a19ef0-9a37-7424-a382-7a1cad1df9d5` | `01a19ef1-a9b2-75eb-96bb-61033a0ca3dc` | 30 | 0.9 MB | 0.29 MB |
| `milk-house` | `01a19f15-c400-7462-9446-110ed21e2f6e` | `01a19f16-ded4-75c5-9e3f-82f9f8478f8f` | 30 | 1.6 MB | 0.28 MB |
| `solar-array` | `01a19f15-cabe-755f-822b-09eccbaa7e97` | `01a19f16-e574-76d4-a412-81f59fbb4022` | 30 | 2.4 MB | 0.65 MB |
| `biogas-digester` | `01a19f15-d0d6-7345-a9f4-756c37709f70` | `01a19f16-ec1a-72e0-861e-d348ddd2c4b3` | 30 | 1.2 MB | 0.39 MB |
| `feed-bunk` | `01a19f15-d6c6-72f3-b792-4a993158429a` | `01a19f16-f218-76bf-a833-8d4d0bfd21a4` | 30 | 1.5 MB | 0.27 MB |
| `water-trough` | `01a19f15-dcca-7439-ae7f-0cdc286f78e7` | `01a19f16-f90f-709e-974c-e12f0a18a562` | 30 | 2.0 MB | 0.44 MB |
| `processing-plant` | `01a19f15-e39e-72a6-abe3-7ef5a44ed724` | `01a19f17-002e-769d-82b4-12fe9b84f770` | 30 | 1.8 MB | 0.51 MB |
| `cheese-line` | `01a19f15-e9da-77e6-91b9-2f91e4478bd8` | `01a19f17-0644-7023-a642-1054020fdef3` | 30 | 1.2 MB | 0.41 MB |
| `pallet-boxes` | `01a19f15-f14a-7524-97f0-126071a4260d` | `01a19f17-0bff-777c-9d5c-b231c6cac2f7` | 30 | 1.0 MB | 0.28 MB |
| `grocery-storefront` | `01a19f15-f841-74a7-aba2-f77a4e39c0dc` | `01a19f17-1275-7076-a27f-021a6bbfc1d8` | 30 | 2.2 MB | 0.41 MB |
| `restaurant-storefront` | `01a19f15-ff95-704b-aa32-002537f6dafe` | `01a19f17-18c6-77cd-a795-0856f65fa135` | 30 | 2.6 MB | 0.61 MB |
| `bistro-set` | `01a19f17-bec9-7133-9f37-45cec236398c` | `01a19f18-4e26-7701-902a-85a297a36d43` | 30 | 1.2 MB | 0.42 MB |
| `produce-crate` | `01a19f18-5593-717f-802a-c204c84a2a56` | `01a19f19-7086-767a-bac7-5d506b088d95` | 30 | 1.6 MB | 0.41 MB |
| `chef` | `01a19f18-587e-70b3-bf58-d91cbaa8dcdb` | `01a19f18-e4e7-746e-9447-c41f68d6db1b` | 30 | 0.9 MB | 0.27 MB |
| `walk-in-cooler` | `01a19f18-5ad4-704c-944f-54a73e4e10f3` | `01a19f19-77ee-774a-abab-a9cab4a01a46` | 30 | 1.5 MB | 0.20 MB |
| `dairy-case` | `01a19f18-5d9c-77c4-8283-23510aaf9f74` | `01a19f19-7f66-7235-ac57-6791e57722da` | 30 | 1.9 MB | 0.26 MB |
