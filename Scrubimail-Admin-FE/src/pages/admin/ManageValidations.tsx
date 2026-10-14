import React from 'react';

import { PageHeader } from '@/components/admin';
import { ValidationExplorer } from './validations/ValidationExplorer';

/** Validation Explorer: every validation across all users, filterable server-side. */
const ManageValidations: React.FC = () => (
    <div className="space-y-6">
        <PageHeader
            title="Validation Explorer"
            description="Every validation across all users. Filter by outcome, source or date, and open a row for the full check breakdown."
        />
        <ValidationExplorer />
    </div>
);

export default ManageValidations;
