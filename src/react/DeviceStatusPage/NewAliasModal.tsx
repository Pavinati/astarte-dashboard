/*
   This file is part of Astarte.

   Copyright 2020 Ispirata Srl

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import React from 'react';
import type { JSONSchema7 } from 'json-schema';
import FormModal from '../components/modals/Form';

const aliasFormSchema: JSONSchema7 = {
  type: 'object',
  required: ['key', 'value'],
  properties: {
    key: {
      title: 'Tag',
      type: 'string',
    },
    value: {
      title: 'Alias',
      type: 'string',
    },
  },
};

interface AliasKeyValue {
  key: string;
  value: string;
}

interface NewAliasModalProps {
  onCancel: () => void;
  onConfirm: ({ key, value }: AliasKeyValue) => void;
  isAddingAlias: boolean;
}

const NewAliasModal = ({
  onCancel,
  onConfirm,
  isAddingAlias,
}: NewAliasModalProps): React.ReactElement => (
  <FormModal
    title="Add New Alias"
    schema={aliasFormSchema}
    onCancel={onCancel}
    onConfirm={onConfirm}
    isConfirming={isAddingAlias}
  />
);

export default NewAliasModal;
