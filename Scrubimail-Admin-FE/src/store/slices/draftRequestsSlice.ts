import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface Draft {
    id: string;
    title: string;
    content: string;
    status: 'draft' | 'pending' | 'published';
    createdAt: string;
    updatedAt: string;
}

interface DraftRequestsState {
    drafts: Draft[];
    loading: boolean;
    error: string | null;
}

const initialState: DraftRequestsState = {
    drafts: [],
    loading: false,
    error: null,
};

// Async thunk for fetching drafts
export const fetchDrafts = createAsyncThunk(
    'draftRequests/fetchDrafts',
    async (userId: string) => {
        // This would be replaced with actual API call
        return [] as Draft[];
    }
);

const draftRequestsSlice = createSlice({
    name: 'draftRequests',
    initialState,
    reducers: {
        addDraft: (state, action: PayloadAction<Draft>) => {
            state.drafts.push(action.payload);
        },
        updateDraft: (state, action: PayloadAction<Draft>) => {
            const index = state.drafts.findIndex(draft => draft.id === action.payload.id);
            if (index !== -1) {
                state.drafts[index] = action.payload;
            }
        },
        deleteDraft: (state, action: PayloadAction<string>) => {
            state.drafts = state.drafts.filter(draft => draft.id !== action.payload);
        },
        clearDrafts: (state) => {
            state.drafts = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDrafts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDrafts.fulfilled, (state, action) => {
                state.loading = false;
                state.drafts = action.payload;
            })
            .addCase(fetchDrafts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch drafts';
            });
    },
});

export const { addDraft, updateDraft, deleteDraft, clearDrafts } = draftRequestsSlice.actions;
export default draftRequestsSlice.reducer;