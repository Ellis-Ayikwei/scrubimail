import React from 'react';

import { ValidationExplorer } from '../validations/ValidationExplorer';
import type { UserTabProps } from './types';

/** The Validation Explorer, pinned to this user. */
const UserValidationsTab: React.FC<UserTabProps> = ({ user }) => <ValidationExplorer userId={user.id} compact />;

export default UserValidationsTab;
