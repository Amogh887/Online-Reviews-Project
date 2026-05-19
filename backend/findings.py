# Causal estimates from Table 12 of Karaman, Chakraborty & Banerjee (2025)
# Values are % of mean DV (e.g., 0.023 = 2.3% of mean revenue)
# "direction": good | bad | mixed | neutral  (drives suggestion logic)

FINDINGS = {
    "negative": {
        "problem_acceptance": {
            "label": "Problem Acceptance",
            "rating": +0.0074,
            "revenue": +0.023,
            "direction": "good",
            "description": "Explicitly acknowledging the issue raised by the guest.",
            "tip_good": "Acknowledging the problem builds trust with future readers and boosts ratings by 0.74% and revenue by 2.3%.",
            "tip_bad": "Consider explicitly acknowledging the specific problem the guest raised — this is the single most impactful positive element.",
        },
        "taking_responsibility": {
            "label": "Taking Responsibility",
            "rating": +0.0014,
            "revenue": +0.006,
            "direction": "good",
            "description": "Admitting fault rather than deflecting blame.",
            "tip_good": "Taking ownership of the fault improves ratings and signals accountability to prospective guests.",
            "tip_bad": "If the issue was within your control, owning it rather than deflecting tends to improve future ratings.",
        },
        "regret": {
            "label": "Expressing Regret",
            "rating": -0.0008,
            "revenue": -0.004,
            "direction": "bad",
            "description": "Expressing deeper remorse beyond a simple apology (e.g., 'We feel terrible').",
            "tip_good": "Your response expresses deep regret. Research shows this can make the negative experience more salient to future reviewers (-0.08% ratings). A concise apology is more effective than extended expressions of remorse.",
            "tip_bad": None,
        },
        "action": {
            "label": "Promising Future Action",
            "rating": -0.0013,
            "revenue": -0.017,
            "direction": "bad",
            "description": "Promising corrective action (e.g., 'We will look into this', 'We will retrain staff').",
            "tip_good": "Your response promises corrective action. Research shows this hurts both ratings (-0.13%) and revenue (-1.7%) — future readers discount unverifiable promises. Consider describing what has already been done instead, or removing the promise entirely.",
            "tip_bad": None,
        },
        "response_tailoring": {
            "label": "Response Tailoring",
            "rating": +0.0043,
            "revenue": +0.025,
            "direction": "good",
            "description": "Addressing the specific topics mentioned in the review (room, staff, cleanliness, etc.).",
            "tip_good": "Your response addresses the specific topics raised. This is a strong signal — tailored responses improve ratings by 0.43% and revenue by 2.5%.",
            "tip_bad": "Your response appears generic. Addressing the specific issues mentioned in the review (e.g., room quality, staff, noise) improves ratings by 0.43% and revenue by 2.5%.",
        },
        "style_matching": {
            "label": "Style Matching",
            "rating": +0.0037,
            "revenue": -0.001,
            "direction": "mixed",
            "description": "Mirroring the guest's tone and phrasing (beyond just topics).",
            "tip_good": "Your response closely mirrors the guest's language. This helps ratings (+0.37%) but has a slight negative effect on revenue. Topic tailoring (addressing the same issues without echoing phrasing) is generally more effective.",
            "tip_bad": None,
        },
        "thanks": {
            "label": "Expressing Thanks",
            "rating": +0.0002,
            "revenue": +0.001,
            "direction": "good",
            "description": "Thanking the guest for their feedback.",
            "tip_good": "Thanking the guest for their feedback, even when negative, signals professionalism.",
            "tip_bad": "A brief thank-you for the feedback can add a professional tone to your response.",
        },
        "loyalty": {
            "label": "Loyalty Mention",
            "rating": -0.0006,
            "revenue": -0.0002,
            "direction": "bad",
            "description": "Referencing loyalty programs or repeat-guest status.",
            "tip_good": "Your response mentions loyalty status/programs. In the context of a complaint, this tends to backfire (-0.06% ratings) — it can feel tone-deaf. Consider removing the loyalty reference.",
            "tip_bad": None,
        },
        "revisit_request": {
            "label": "Revisit Request",
            "rating": -0.0001,
            "revenue": -0.0003,
            "direction": "neutral",
            "description": "Inviting the guest to return.",
            "tip_good": None,
            "tip_bad": None,
        },
        "apology": {
            "label": "Apology",
            "rating": +0.0005,
            "revenue": +0.0001,
            "direction": "good",
            "description": "A simple 'sorry' or 'we apologize'.",
            "tip_good": "A concise apology is appropriate and has a small positive effect on future ratings.",
            "tip_bad": "Including a brief apology has a small but positive effect on future ratings.",
        },
    },
    "positive": {
        "response_tailoring": {
            "label": "Response Tailoring",
            "rating": +0.0039,
            "revenue": +0.046,
            "direction": "good",
            "description": "Addressing the specific highlights mentioned by the guest.",
            "tip_good": "Your response addresses the specific positives the guest mentioned. This is highly effective — tailoring to positive reviews improves revenue by 4.6%.",
            "tip_bad": "Your response seems generic. Referencing what the guest specifically praised (staff, breakfast, location, etc.) improves ratings by 0.39% and revenue by 4.6%.",
        },
        "style_matching": {
            "label": "Style Matching",
            "rating": +0.011,
            "revenue": -0.054,
            "direction": "mixed",
            "description": "Closely mirroring the guest's tone and phrasing.",
            "tip_good": "Your response closely echoes the guest's language. While this improves future ratings (+1.1%), it significantly hurts revenue (-5.4%) — prospective customers may find it repetitive or inauthentic. Consider referencing the same topics with your own words.",
            "tip_bad": None,
        },
        "thanks": {
            "label": "Expressing Thanks",
            "rating": 0.0000,
            "revenue": +0.0003,
            "direction": "neutral",
            "description": "Thanking the guest for their positive review.",
            "tip_good": None,
            "tip_bad": None,
        },
        "loyalty": {
            "label": "Loyalty Mention",
            "rating": +0.0006,
            "revenue": -0.002,
            "direction": "mixed",
            "description": "Referencing loyalty programs or repeat-guest status.",
            "tip_good": "Loyalty mentions have a small positive effect on ratings for positive reviews, though a slight negative effect on revenue.",
            "tip_bad": None,
        },
        "revisit_request": {
            "label": "Revisit Request",
            "rating": 0.0000,
            "revenue": -0.0002,
            "direction": "neutral",
            "description": "Inviting the guest to return.",
            "tip_good": None,
            "tip_bad": None,
        },
        "apology": {
            "label": "Apology",
            "rating": -0.0004,
            "revenue": +0.005,
            "direction": "mixed",
            "description": "Apologizing in a response to a positive review.",
            "tip_good": "Your response includes an apology in reply to a positive review. This slightly reduces future ratings (-0.04%) — it can seem unnecessary or insincere. Consider removing it unless addressing a minor complaint within the positive review.",
            "tip_bad": None,
        },
    },
}

# Key headline stats for the dashboard (Tables 8 & 9 + external sources)
HEADLINE_STATS = {
    "neg_response_rating_lift": 0.24,
    "pos_response_rating_lift": 0.03,
    "dataset_reviews": "5.4M",
    "dataset_hotels": "4,910",
    "dataset_years": "12",
    "revenue_significant": False,
    # Brightlocal 2023 consumer stats
    "pct_unlikely_if_no_response": 58,
    "pct_likely_if_responds_all": 88,
    # Key insight about audience split
    "audience_split_insight": (
        "Future reviewers and prospective customers react differently to the same response. "
        "Future reviewers use responses as a benchmark when writing their own review. "
        "Prospective customers use them to decide whether to book — making response quality "
        "a lever for both reputation and revenue."
    ),
}

# Chart data for the dashboard (Table 12)
CHART_DATA = {
    "ratings": [
        {"element": "Problem Acceptance", "negative": 0.74, "positive": None},
        {"element": "Response Tailoring", "negative": 0.43, "positive": 0.39},
        {"element": "Style Matching", "negative": 0.37, "positive": 1.10},
        {"element": "Taking Responsibility", "negative": 0.14, "positive": None},
        {"element": "Apology", "negative": 0.05, "positive": -0.04},
        {"element": "Loyalty", "negative": -0.06, "positive": 0.06},
        {"element": "Regret", "negative": -0.08, "positive": None},
        {"element": "Action Promises", "negative": -0.13, "positive": None},
    ],
    "revenue": [
        {"element": "Response Tailoring", "negative": 2.50, "positive": 4.60},
        {"element": "Problem Acceptance", "negative": 2.30, "positive": None},
        {"element": "Taking Responsibility", "negative": 0.60, "positive": None},
        {"element": "Apology", "negative": 0.06, "positive": 0.50},
        {"element": "Loyalty", "negative": -0.02, "positive": -0.20},
        {"element": "Regret", "negative": -0.40, "positive": None},
        {"element": "Action Promises", "negative": -1.70, "positive": None},
        {"element": "Style Matching", "negative": -0.10, "positive": -5.40},
    ],
}
