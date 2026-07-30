import { retrieveRelevantKnowledge } from './retriever.js';

export function generateLocalFallbackAnswer(query: string): string {
  const { contextText, matchedSections, isLoaded } = retrieveRelevantKnowledge(query, 5);

  if (!isLoaded || !contextText) {
    return "The Nakuru Urban Heat Observatory knowledge base is currently unreadable or unavailable.";
  }

  const q = query.toLowerCase();

  // 1. Mean SIUHI questions
  if (q.includes('mean siuhi') || (q.includes('mean') && q.includes('2026')) || q.includes('average siuhi')) {
    if (q.includes('2026')) {
      return "The mean SIUHI in 2026 was -1.1073 (specifically -1.10729925). The mean SIUHI remained negative across all study years (2021-2026), indicating that overall surface conditions averaged slightly cooler than the regional baseline, despite localized positive heat pockets.";
    }
    if (q.includes('highest') || q.includes('warmest')) {
      return "The highest annual mean SIUHI occurred in 2021 at approximately -1.07 (-1.074435732).";
    }
    if (q.includes('lowest') || q.includes('coolest')) {
      return "The lowest annual mean SIUHI occurred in 2022 at approximately -1.57 (-1.566664975), followed closely by 2023 at approximately -1.56 (-1.557210950).";
    }
    return "Annual mean SIUHI values (2021-2026):\n- 2021: -1.0744\n- 2022: -1.5667\n- 2023: -1.5572\n- 2024: -1.1581\n- 2025: -1.1795\n- 2026: -1.1073\n\nThe highest mean occurred in 2021 (-1.07), and the lowest in 2022 (-1.57).";
  }

  // 2. Very High heat area change
  if (q.includes('very high') && (q.includes('area') || q.includes('change') || q.includes('extent') || q.includes('km'))) {
    if (q.includes('2021') && q.includes('2026')) {
      return "Very High heat area was 138.23 km² in 2021 and 139.34 km² in 2026. Across the full study period, Very High heat area expanded to a peak of 179.69 km² in 2022, before gradually declining to 165.85 km² in 2023, 150.91 km² in 2024, 149.78 km² in 2025, and 139.34 km² in 2026. Note that while Very High heat area decreased after 2022, High heat area increased from 153.77 km² (2022) to 211.48 km² (2026).";
    }
    if (q.includes('2026')) {
      return "In 2026, the Very High heat class occupied 139.34 km² (139.3352373 km²). For comparison, High heat area was larger at 211.48 km², Moderate heat area was 116.87 km², and Low heat area was 116.15 km².";
    }
    return "Very High heat area values (km²):\n- 2021: 138.23 km²\n- 2022: 179.69 km² (peak)\n- 2023: 165.85 km²\n- 2024: 150.91 km²\n- 2025: 149.78 km²\n- 2026: 139.34 km²";
  }

  // 3. Population exposure questions
  if (q.includes('population') || q.includes('exposed') || q.includes('people') || q.includes('exposure')) {
    if (q.includes('very high') && q.includes('2026')) {
      return "In 2026, approximately 375,646.72 people (375,647) were exposed to Very High heat conditions. High heat exposure in 2026 was 303,447.12 people, Moderate heat exposure was 55,824.13 people, and Low heat exposure was 1,326.20 people.";
    }
    if (q.includes('highest') || q.includes('peak')) {
      return "The highest population exposure to Very High heat occurred in 2025, with approximately 407,475.76 people exposed. For High heat exposure, the peak occurred in 2023 with 417,961.70 people.";
    }
    if (q.includes('2021')) {
      return "In 2021, Very High heat population exposure was 300,291.70 people, while High heat exposure was 315,302.46 people.";
    }
    return "Population exposure to Very High heat (2021-2026):\n- 2021: 300,291.70\n- 2022: 235,741.19\n- 2023: 198,169.88\n- 2024: 348,936.76\n- 2025: 407,475.76 (peak)\n- 2026: 375,646.72\n\nPopulation exposure depends on both physical heat extent and spatial population distribution. Note that exposure estimates do not directly represent individual health outcomes.";
  }

  // 4. Land cover questions
  if (q.includes('land cover') || q.includes('land-cover') || q.includes('hottest') || q.includes('coolest') || q.includes('built-up') || q.includes('built up')) {
    if (q.includes('hottest') || q.includes('warmest') || q.includes('highest')) {
      return "Bare / Sparse Vegetation was the hottest land-cover category in 2026 with a mean SIUHI of 3.30 (down from 4.37 in 2021). Built-up was the second-hottest category in 2026 with a mean SIUHI of 3.05 (up from 2.69 in 2021).";
    }
    if (q.includes('coolest') || q.includes('lowest')) {
      return "Permanent Water Bodies was the coolest land-cover category in both 2021 (mean SIUHI -10.29) and 2026 (mean SIUHI -10.08). Herbaceous Wetland was second-coolest (-4.29 in 2026), followed by Tree Cover (-3.63 in 2026).";
    }
    if (q.includes('built-up') || q.includes('built up')) {
      return "Built-up areas had a mean SIUHI of 2.69 in 2021 and 3.05 in 2026, representing an increase of +0.36. This indicates relatively warmer surface conditions in built-up areas in 2026 compared to 2021.";
    }
    return "SIUHI by Land Cover (2021 vs 2026):\n- Permanent Water Bodies: -10.29 (2021) -> -10.08 (2026)\n- Herbaceous Wetland: -3.90 (2021) -> -4.29 (2026)\n- Tree Cover: -3.73 (2021) -> -3.63 (2026)\n- Shrubland: -2.01 (2021) -> -2.20 (2026)\n- Grassland: 1.43 (2021) -> 1.60 (2026)\n- Cropland: 2.06 (2021) -> 1.25 (2026)\n- Built-up: 2.69 (2021) -> 3.05 (2026)\n- Bare / Sparse Vegetation: 4.37 (2021) -> 3.30 (2026)";
  }

  // 5. Lake Nakuru cooling effect
  if (q.includes('lake') || q.includes('nakuru') || q.includes('cooling') || q.includes('distance') || q.includes('band')) {
    return "Distance-band analysis around Lake Nakuru demonstrates a strong spatial gradient in SIUHI:\n- 0-500 m: -9.16 in 2026 (-9.08 in 2021)\n- 500-1000 m: -3.31 in 2026 (-2.76 in 2021)\n- 1000-2000 m: -0.82 in 2026 (-0.80 in 2021)\n- 2000-3000 m: 1.88 in 2026 (1.62 in 2021)\n- 3000-5000 m: 3.13 in 2026 (2.24 in 2021)\n\nThe closest band (0-500 m) shows the strongest cooling association (-9.16), while areas farther than 2000 m display positive surface thermal values. Note: This indicates a strong spatial association, but does not prove Lake Nakuru is the sole cause, as elevation, urban form, and land cover also vary with distance.";
  }

  // 6. Hotspots
  if (q.includes('hotspot') || q.includes('persistent') || q.includes('new hotspot')) {
    return "The temporal hotspot analysis across 2021-2026 identified:\n- Persistent Hotspots: 950 features (locations repeatedly meeting high-heat criteria)\n- No Longer Very High: 934 features (locations previously high-heat that declined)\n- New Hotspots: 460 features (emerging high-heat locations)\n\nPersistent Hotspots represent the largest category among the three.";
  }

  // 7. Interventions
  if (q.includes('intervention') || q.includes('solution') || q.includes('mitigat') || q.includes('cooling strategy') || q.includes('green roof')) {
    return "Recommended urban cooling interventions for Nakuru:\n1. Nature-Based Solutions: Tree canopy expansion in built-up hotspots (built-up SIUHI reached 3.05 in 2026), protection of Lake Nakuru riparian buffers (0-500 m band SIUHI -9.16), and soil vegetation restoration on bare grounds.\n2. Built-Environment Retrofits: Cool reflective roofing on corrugated metal roofs, permeable paving blocks, and passive building designs with cross-ventilation.\n3. Targeted Priority Zones: Prioritizing high-density wards with over 375,000 residents exposed to Very High heat and targeting the 950 persistent heat hotspots.";
  }

  // 8. Recommendations & Guides
  if (q.includes('recommendation') || q.includes('guide') || q.includes('planner') || q.includes('policy') || q.includes('action')) {
    return "Urban Heat Management Guide & Recommendations for Nakuru:\n1. For Urban Planners: Integrate SIUHI heat maps into municipal zoning, mandate 20-30% minimum green plot ratios for new developments, and protect cooling wind corridors connecting Lake Nakuru to urban centers.\n2. For Public Health: Establish cooling stations and targeted advisories in vulnerable high-exposure wards (over 375,000 people in Very High heat zones in 2026).\n3. For Environmental Researchers: Maintain continuous satellite SIUHI tracking paired with microclimate sensor networks, and evaluate annual progress across the 950 persistent and 460 emerging hotspots.";
  }

  // 9. Air temperature vs SIUHI
  if (q.includes('air temperature') || q.includes('air temp') || q.includes('thermal comfort')) {
    return "SIUHI (Surface Urban Heat Island Intensity) describes relative land surface thermal conditions derived from satellite thermal observations. It is NOT the same as air temperature and should not be interpreted as a direct measurement of human thermal comfort or air temperature.";
  }

  // 8. General summaries / key findings
  if (q.includes('summary') || q.includes('findings') || q.includes('overview') || q.includes('key findings')) {
    return "Key findings of the Nakuru Urban Heat Observatory (2021-2026):\n1. Overall Mean SIUHI remained negative (-1.11 in 2026).\n2. Very High heat area peaked in 2022 (179.69 km²) and was 139.34 km² in 2026, while High heat area expanded to 211.48 km².\n3. Very High population exposure peaked in 2025 at 407,476 people and stood at 375,647 in 2026.\n4. Persistent Hotspots total 950, New Hotspots total 460, and 934 areas are No Longer Very High.\n5. Bare / Sparse Vegetation (3.30) and Built-up (3.05) were the warmest land covers in 2026; Permanent Water (-10.08) was the coolest.\n6. Lake Nakuru exhibits a strong spatial cooling association, from -9.16 (0-500 m) to 3.13 (3000-5000 m).";
  }

  // Generic matching fallback from top retrieved sections
  if (matchedSections.length > 0 && matchedSections[0].content) {
    const topSec = matchedSections[0];
    let contentSnippet = topSec.content.replace(/^#+\s+.*$/gm, '').trim();
    if (contentSnippet.length > 600) {
      contentSnippet = contentSnippet.substring(0, 600) + '...';
    }
    return `Based on the Nakuru Urban Heat Observatory knowledge base (${topSec.title}):\n\n${contentSnippet}`;
  }

  return "I couldn't find enough information about that in the Nakuru Urban Heat Observatory knowledge base.";
}
