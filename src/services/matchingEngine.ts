import { EmergencyRequest, Hospital, HospitalMatchResult } from '../types';

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export function calculateDemoEtaMinutes(distanceKm: number): number {
  const transit = (distanceKm / 32.0) * 60.0;
  return Math.round((transit + 3.0) * 10) / 10;
}

export function rankHospitalsClient(
  emergency: Partial<EmergencyRequest>,
  hospitals: Hospital[],
  nowDate: Date = new Date()
): HospitalMatchResult[] {
  const staleThresholdMinutes = 10;
  const nowMs = nowDate.getTime();

  const emergencyCat = (emergency.category || 'general').toLowerCase();
  const emergencySev = (emergency.severity || 'moderate').toLowerCase();
  const requiredCaps = (emergency.required_capabilities || []).map((c) =>
    c.toLowerCase()
  );
  const requiredRes = emergency.required_resources || [];

  const hasPatientCoords =
    typeof emergency.patient_latitude === 'number' &&
    typeof emergency.patient_longitude === 'number';

  const results: HospitalMatchResult[] = [];

  for (const hosp of hospitals) {
    const missingRequirements: string[] = [];
    const verificationReasons: string[] = [];
    const positiveFactors: string[] = [];

    // 1. Operational status
    if (hosp.operational_status === 'diverted') {
      missingRequirements.push('Hospital is actively diverting emergency traffic');
    } else if (hosp.operational_status === 'at_capacity') {
      missingRequirements.push('Hospital emergency department reported at capacity');
    }

    // 2. Capabilities check
    const activeCaps = new Set<string>();
    for (const cap of hosp.capabilities || []) {
      if (cap.is_active) {
        activeCaps.add(cap.capability_code.toLowerCase());
      }
    }

    for (const reqC of requiredCaps) {
      if (!activeCaps.has(reqC)) {
        missingRequirements.push(`Missing mandatory capability: ${reqC.replace(/_/g, ' ')}`);
      } else {
        positiveFactors.push(`Confirmed capability: ${reqC.replace(/_/g, ' ')}`);
      }
    }

    const defaultCapMap: Record<string, string> = {
      cardiac: 'cath_lab',
      stroke: 'stroke_unit',
      trauma: 'trauma_center_l1',
      pediatric: 'pediatric_icu',
      burn: 'burn_unit',
    };
    const neededDefCap = defaultCapMap[emergencyCat];
    if (
      neededDefCap &&
      !activeCaps.has(neededDefCap) &&
      (emergencySev === 'high' || emergencySev === 'critical')
    ) {
      missingRequirements.push(
        `Lacks specialized ${neededDefCap.replace(/_/g, ' ')} for ${emergencyCat} emergency`
      );
    }

    // 3. Resources and Freshness
    const resources = hosp.resources || [];
    let staleCount = 0;
    let unknownCount = 0;
    let mostRecentSnapshot = new Date(nowMs - 24 * 3600000).toISOString();
    let hasFreshTs = false;

    const resByType = new Map<string, typeof resources>();
    for (const r of resources) {
      const typeKey = r.resource_type.toLowerCase();
      if (!resByType.has(typeKey)) {
        resByType.set(typeKey, []);
      }
      resByType.get(typeKey)!.push(r);

      if (r.last_verified_at) {
        hasFreshTs = true;
        const tsTime = new Date(r.last_verified_at).getTime();
        if (tsTime > new Date(mostRecentSnapshot).getTime()) {
          mostRecentSnapshot = r.last_verified_at;
        }
        const ageMinutes = (nowMs - tsTime) / 60000;
        if (ageMinutes > staleThresholdMinutes) {
          staleCount++;
        }
      } else {
        staleCount++;
      }

      if (r.availability_status === 'unknown') {
        unknownCount++;
      }
    }

    if (!hasFreshTs) {
      mostRecentSnapshot = new Date(nowMs - 3600000).toISOString();
    }

    for (const reqR of requiredRes) {
      const rType = reqR.resource_type.toLowerCase();
      const minQty = reqR.minimum_quantity || 1;
      const matched = resByType.get(rType) || [];

      if (matched.length === 0) {
        missingRequirements.push(`No ${rType} inventory registered in hospital catalog`);
        continue;
      }

      let totalAvail = 0;
      let hasFreshVerified = false;
      let hasUnknownOrStale = false;

      for (const item of matched) {
        const itemStatus = item.availability_status;
        const itemQty = item.available_quantity || 0;
        const itemAge = item.last_verified_at
          ? (nowMs - new Date(item.last_verified_at).getTime()) / 60000
          : 999;
        const isItemStale = itemAge > staleThresholdMinutes;

        if (itemStatus === 'unavailable') {
          continue;
        } else if (itemStatus === 'unknown' || isItemStale) {
          hasUnknownOrStale = true;
          totalAvail += itemQty;
        } else if (itemStatus === 'available' || itemStatus === 'limited') {
          if (!isItemStale) {
            hasFreshVerified = true;
            totalAvail += itemQty;
          } else {
            hasUnknownOrStale = true;
            totalAvail += itemQty;
          }
        }
      }

      if (totalAvail < minQty) {
        missingRequirements.push(
          `Insufficient ${rType}: required ${minQty}, reported ${totalAvail}`
        );
      } else if (hasUnknownOrStale && !hasFreshVerified) {
        verificationReasons.push(
          `Critical ${rType} data is stale (> ${staleThresholdMinutes}m old); requires radio verification`
        );
      } else {
        positiveFactors.push(`Adequate fresh ${rType} available (${totalAvail} units)`);
      }
    }

    // 4. Specialist availability
    let specialistAvail = false;
    const specialistMap: Record<string, string> = {
      cardiac: 'interventional_cardiologist',
      stroke: 'neurologist',
      trauma: 'trauma_surgeon',
      pediatric: 'pediatric_intensivist',
      burn: 'burn_specialist',
    };
    const neededSpec = specialistMap[emergencyCat];
    if (neededSpec) {
      for (const s of hosp.staff_availability || []) {
        if (
          s.specialty.toLowerCase().includes(neededSpec) &&
          (s.is_available_now || s.on_duty_count > 0)
        ) {
          specialistAvail = true;
          positiveFactors.push(`On-duty specialist: ${s.specialty.replace(/_/g, ' ')}`);
          break;
        }
      }
      if (!specialistAvail && (emergencySev === 'high' || emergencySev === 'critical')) {
        verificationReasons.push(
          `On-duty ${neededSpec.replace(/_/g, ' ')} not confirmed on shift`
        );
      }
    }

    // 5. Distance and ETA
    let distanceKm: number | null = null;
    let etaMinutes: number | null = null;
    if (
      hasPatientCoords &&
      typeof hosp.latitude === 'number' &&
      typeof hosp.longitude === 'number'
    ) {
      distanceKm = calculateDistanceKm(
        emergency.patient_latitude!,
        emergency.patient_longitude!,
        hosp.latitude,
        hosp.longitude
      );
      etaMinutes = calculateDemoEtaMinutes(distanceKm);
      positiveFactors.push(`Distance ~${distanceKm} km (demo ETA: ~${etaMinutes} mins)`);
    }

    // 6. Eligibility Status
    let eligibilityStatus: HospitalMatchResult['eligibility_status'] = 'eligible';
    if (missingRequirements.length > 0) {
      eligibilityStatus = 'ineligible';
    } else if (verificationReasons.length > 0) {
      eligibilityStatus = 'requires_verification';
    }

    // 7. Deterministic Scoring
    let baseScore =
      eligibilityStatus === 'eligible'
        ? 75.0
        : eligibilityStatus === 'requires_verification'
        ? 45.0
        : 15.0;

    let distComponent = 0;
    if (distanceKm !== null) {
      if (distanceKm <= 3.0) distComponent = 20.0;
      else if (distanceKm <= 8.0) distComponent = 16.0;
      else if (distanceKm <= 15.0) distComponent = 10.0;
      else if (distanceKm <= 25.0) distComponent = 5.0;
      else distComponent = 1.0;
    }

    const specBonus = specialistAvail ? 5.0 : 0.0;
    const freshPenalty = Math.min(staleCount * 2.0 + unknownCount * 1.5, 15.0);

    const rawScore = baseScore + distComponent + specBonus - freshPenalty;
    const finalScore = Math.round(Math.max(5.0, Math.min(99.0, rawScore)) * 10) / 10;

    let overallFreshness: HospitalMatchResult['resource_freshness'] = 'fresh';
    if (staleCount > 0) overallFreshness = 'stale';
    else if (unknownCount > 0) overallFreshness = 'unknown';

    const allReasons = [
      ...missingRequirements.map((m) => `INELIGIBLE: ${m}`),
      ...verificationReasons,
      ...positiveFactors,
    ];

    results.push({
      hospital_id: hosp.id,
      match_score: finalScore,
      eta_minutes: etaMinutes,
      eligibility_status: eligibilityStatus,
      missing_requirements: missingRequirements,
      resource_snapshot_at: mostRecentSnapshot,
      distance_km: distanceKm,
      reasons: allReasons,
      resource_freshness: overallFreshness,
      hospital_name: hosp.name,
      hospital_address: hosp.address,
      hospital_phone: hosp.contact_phone,
      emergency_direct_line: hosp.emergency_direct_line,
    });
  }

  // Deterministic Sort
  results.sort((a, b) => {
    const orderMap: Record<string, number> = {
      eligible: 0,
      requires_verification: 1,
      ineligible: 2,
    };
    const orderDiff = orderMap[a.eligibility_status] - orderMap[b.eligibility_status];
    if (orderDiff !== 0) return orderDiff;

    const scoreDiff = b.match_score - a.match_score;
    if (scoreDiff !== 0) return scoreDiff;

    const aEta = a.eta_minutes ?? 9999;
    const bEta = b.eta_minutes ?? 9999;
    if (aEta !== bEta) return aEta - bEta;

    return a.hospital_id.localeCompare(b.hospital_id);
  });

  results.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return results;
}
