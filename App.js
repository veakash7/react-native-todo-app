import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  useColorScheme,
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  FlatList,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [text, setText] = useState('');
  const [todos, setTodos] = useState([]);
  const [editingTodoId, setEditingTodoId] = useState(null);
  const theme = useColorScheme(); // 'light' or 'dark'
  if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
const handleBiometricAuth = async () => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || supported.length === 0 || !enrolled) {
    alert('Biometric auth not supported/enabled on this device');
    return;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access your To-Do List',
    fallbackLabel: 'Enter passcode',
    disableDeviceFallback: false, // Allows PIN/password fallback
  });

  if (result.success) {
    setAuthenticated(true);
  } else {
    alert('Authentication failed');
  }
};
useEffect(() => {
  handleBiometricAuth();
}, []);

  const styles = getStyles(theme);

  // Save todos to storage
  const saveTodosToStorage = async (newTodos) => {
    try {
      await AsyncStorage.setItem('@todos', JSON.stringify(newTodos));
    } catch (error) {
      console.log('Error saving todos', error);
    }
  };

  // Load todos on app start
  useEffect(() => {
    const loadTodos = async () => {
      try {
        const stored = await AsyncStorage.getItem('@todos');
        if (stored !== null) {
          setTodos(JSON.parse(stored));
        }
      } catch (error) {
        console.log('Error loading todos', error);
      }
    };

    loadTodos();
  }, []);

  // Add or update todo
  const handleAddOrUpdateTodo = () => {
    if (text.trim().length === 0) return;

    if (editingTodoId) {
      // Update mode
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      setTodos((current) => {
        const updated = current.map((todo) =>
          todo.id === editingTodoId ? { ...todo, text } : todo
        );
        saveTodosToStorage(updated);
        return updated;
      });
      setEditingTodoId(null); // exit edit mode
    } else {
      // Add mode
      const newTodo = {
        id: Math.random().toString(),
        text: text,
        completed: false,
      };
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTodos((current) => {
        const updated = [...current, newTodo];
        saveTodosToStorage(updated);
        return updated;
      });
    }

    setText('');
  };

  // Toggle complete
  const handleToggleComplete = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTodos((current) => {
      const updated = current.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );
      saveTodosToStorage(updated);
      return updated;
    });
  };

  // Delete todo
  const handleRemoveTodo = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTodos((current) => {
      const updated = current.filter((todo) => todo.id !== id);
      saveTodosToStorage(updated);
      return updated;
    });
  };
if (!authenticated) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔐 Locked</Text>
      <Button title="Try Again" onPress={handleBiometricAuth} />
    </View>
  );
}
  return (
    
    <View style={styles.container}>
      <Text style={styles.title}>My To-Do List</Text>

      {/* Input Section */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Add a new to-do..."
          style={styles.input}
          onChangeText={(newText) => setText(newText)}
          value={text}
        />
        <Button
          title={editingTodoId ? 'Update' : 'Add'}
          onPress={handleAddOrUpdateTodo}
          color={editingTodoId ? 'orange' : 'purple'}
        />
      </View>

      {/* To-Do List */}
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleToggleComplete(item.id)}
            onLongPress={() => {
              setText(item.text);
              setEditingTodoId(item.id);
            }}
          >
            <View style={styles.listItem}>
              <Text
                style={[
                  styles.todoText,
                  item.completed && styles.completedText,
                ]}
              >
                {item.text}
              </Text>

              <Pressable onPress={() => handleRemoveTodo(item.id)}>
                <Feather name="trash-2" size={20} color="red" />
              </Pressable>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

  const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 60,
      paddingHorizontal: 20,
      backgroundColor: theme === 'dark' ? '#121212' : '#f5f5f5',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
      color: theme === 'dark' ? '#fff' : '#000',
    },
    inputContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    input: {
      flex: 1,
      borderColor: '#ccc',
      borderWidth: 1,
      padding: 10,
      marginRight: 10,
      borderRadius: 5,
      backgroundColor: theme === 'dark' ? '#1e1e1e' : 'white',
      color: theme === 'dark' ? 'white' : 'black',
    },
    listItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#1e1e1e' : 'white',
      padding: 15,
      marginVertical: 5,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: '#ccc',
    },
    todoText: {
      fontSize: 16,
      color: theme === 'dark' ? '#eee' : '#333',
    },
    completedText: {
      textDecorationLine: 'line-through',
      color: '#888',
    },
  });
